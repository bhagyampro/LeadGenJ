"""Policy-safe lead CSV cleaner for LeadgenJ.

This script intentionally does not scrape LinkedIn, automate LinkedIn, use
cookies, or fetch LinkedIn profile pages. It only normalizes user-provided CSV
exports from approved sources so they can be imported into LeadgenJ.

Usage:
  python scripts/policy_safe_lead_importer.py input.csv output.csv

Supported input headers are flexible. Examples:
  first name, first_name, firstname
  last name, last_name, lastname
  title, role, job title
  company, organization
  industry
  country, location
  email, email address
  phone, phone number
  linkedin, linkedin url, linkedin profile url
  connections, connection count
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from urllib.parse import urlparse


FIELD_ALIASES = {
    "firstName": {"first name", "first_name", "firstname", "given name", "given_name"},
    "lastName": {"last name", "last_name", "lastname", "surname", "family name", "family_name"},
    "title": {"title", "role", "job title", "job_title", "position", "headline"},
    "company": {"company", "organization", "organisation", "company name", "company_name"},
    "industry": {"industry", "category", "vertical"},
    "location": {"location", "country", "region", "geo"},
    "email": {"email", "email address", "email_address", "work email", "work_email"},
    "phone": {"phone", "phone number", "phone_number", "mobile", "work phone", "work_phone"},
    "linkedinProfileUrl": {
        "linkedin",
        "linkedin url",
        "linkedin_url",
        "linkedin profile",
        "linkedin profile url",
        "linkedin_profile_url",
        "profile url",
        "profile_url",
    },
    "connectionCount": {"connections", "connection count", "connection_count", "followers"},
}

OUTPUT_FIELDS = [
    "firstName",
    "lastName",
    "title",
    "company",
    "industry",
    "location",
    "email",
    "phone",
    "linkedinProfileUrl",
    "connectionCount",
    "status",
    "notes",
]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"[^0-9+]")


def normalize_header(header: str) -> str:
    return re.sub(r"\s+", " ", header.strip().lower().replace("-", " ")).strip()


def build_header_map(headers: list[str]) -> dict[str, str]:
    normalized = {normalize_header(header): header for header in headers}
    header_map: dict[str, str] = {}

    for output_field, aliases in FIELD_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                header_map[output_field] = normalized[alias]
                break

    return header_map


def clean_text(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def clean_email(value: str | None) -> str:
    email = clean_text(value).lower()
    return email if EMAIL_RE.match(email) else ""


def clean_phone(value: str | None) -> str:
    phone = PHONE_RE.sub("", clean_text(value))
    return phone if len(phone) >= 7 else ""


def clean_connection_count(value: str | None) -> str:
    raw = clean_text(value).lower().replace(",", "")
    match = re.search(r"\d+", raw)
    return match.group(0) if match else ""


def clean_linkedin_url(value: str | None) -> str:
    raw = clean_text(value)
    if not raw:
        return ""

    if raw.startswith("linkedin.com/"):
        raw = f"https://www.{raw}"
    elif raw.startswith("www.linkedin.com/"):
        raw = f"https://{raw}"

    parsed = urlparse(raw)
    host = parsed.netloc.lower()
    path = parsed.path.strip("/")

    if host not in {"linkedin.com", "www.linkedin.com"}:
        return ""

    if not path.startswith("in/"):
        return ""

    slug = path.split("/", 2)[1]
    if not slug:
        return ""

    return f"https://www.linkedin.com/in/{slug}/"


def get_value(row: dict[str, str], header_map: dict[str, str], field: str) -> str:
    source_header = header_map.get(field)
    return row.get(source_header, "") if source_header else ""


def normalize_row(row: dict[str, str], header_map: dict[str, str]) -> dict[str, str]:
    linkedin_url = clean_linkedin_url(get_value(row, header_map, "linkedinProfileUrl"))
    email = clean_email(get_value(row, header_map, "email"))
    phone = clean_phone(get_value(row, header_map, "phone"))

    status = "ready"
    notes: list[str] = []

    if not linkedin_url:
        status = "review"
        notes.append("missing_or_invalid_linkedin_url")

    if not email:
        notes.append("missing_or_invalid_email")

    return {
        "firstName": clean_text(get_value(row, header_map, "firstName")),
        "lastName": clean_text(get_value(row, header_map, "lastName")),
        "title": clean_text(get_value(row, header_map, "title")),
        "company": clean_text(get_value(row, header_map, "company")),
        "industry": clean_text(get_value(row, header_map, "industry")),
        "location": clean_text(get_value(row, header_map, "location")),
        "email": email,
        "phone": phone,
        "linkedinProfileUrl": linkedin_url,
        "connectionCount": clean_connection_count(get_value(row, header_map, "connectionCount")),
        "status": status,
        "notes": ",".join(notes),
    }


def convert_csv(input_path: Path, output_path: Path) -> tuple[int, int]:
    with input_path.open("r", encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file)
        if not reader.fieldnames:
            raise ValueError("Input CSV has no header row.")

        header_map = build_header_map(reader.fieldnames)
        rows = [normalize_row(row, header_map) for row in reader]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    ready = sum(1 for row in rows if row["status"] == "ready")
    return len(rows), ready


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean a lead CSV for policy-safe LeadgenJ import.")
    parser.add_argument("input_csv", type=Path)
    parser.add_argument("output_csv", type=Path)
    args = parser.parse_args()

    total, ready = convert_csv(args.input_csv, args.output_csv)
    print(f"Processed {total} leads. {ready} ready, {total - ready} need review.")
    print(f"Output written to: {args.output_csv}")


if __name__ == "__main__":
    main()
