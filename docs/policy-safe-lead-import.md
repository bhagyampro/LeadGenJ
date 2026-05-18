# Policy-Safe Lead Import

LeadgenJ does not scrape LinkedIn pages. LinkedIn states that third-party crawlers, bots, browser extensions, and automation that scrape or automate activity on LinkedIn are not permitted.

Use this workflow instead:

1. Export leads from an approved source or your own CRM.
2. Clean the file:

```powershell
python scripts/policy_safe_lead_importer.py leads.csv cleaned-leads.csv
```

3. Review rows marked `review`.
4. Import the cleaned CSV into LeadgenJ.

The script:

- Normalizes LinkedIn profile URLs to `https://www.linkedin.com/in/name-slug/`
- Validates email shape
- Cleans phone numbers
- Preserves role, industry, country, company, connection count
- Does not fetch LinkedIn pages
- Does not use cookies or sessions
- Does not automate LinkedIn

Use official APIs or approved providers for live enrichment.
