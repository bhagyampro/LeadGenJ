export type NormalizedLeadImport = {
  firstName: string
  lastName: string
  title: string
  company: string
  industry: string
  location: string
  linkedinProfileUrl: string
  source: string
}

const aliases = {
  firstName: ['first name', 'firstname', 'first', 'first_name'],
  lastName: ['last name', 'lastname', 'last', 'last_name'],
  title: ['title', 'role', 'job title', 'job_title', 'position', 'headline'],
  company: ['company', 'company name', 'company_name', 'organization', 'organisation'],
  industry: ['industry', 'category', 'vertical'],
  location: ['location', 'country', 'region'],
  linkedinProfileUrl: ['linkedin', 'linkedin url', 'linkedin_url', 'linkedin profile url', 'linkedin_profile_url', 'profile url', 'profile_url'],
}

export function normalizeImportHeader(header: string) {
  return header.toLowerCase().trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ')
}

export function normalizeLinkedInUrl(value: string) {
  const raw = value.trim()
  if (!raw) return ''
  if (raw.startsWith('linkedin.com/')) return `https://www.${raw.replace(/\/?$/, '/')}`
  if (raw.startsWith('www.linkedin.com/')) return `https://${raw.replace(/\/?$/, '/')}`
  if (raw.includes('linkedin.com/in/')) return raw.replace(/\/?$/, '/')
  return raw
}

function pickValue(row: Record<string, unknown>, fieldAliases: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeImportHeader(key), value] as const)
  const match = normalizedEntries.find(([key]) => fieldAliases.includes(key))
  return String(match?.[1] || '').trim()
}

export function mapLeadImportRows(rows: Array<Record<string, unknown>>, source = 'spreadsheet_import') {
  return rows
    .map<NormalizedLeadImport>((row) => ({
      firstName: pickValue(row, aliases.firstName),
      lastName: pickValue(row, aliases.lastName),
      title: pickValue(row, aliases.title),
      company: pickValue(row, aliases.company),
      industry: pickValue(row, aliases.industry),
      location: pickValue(row, aliases.location),
      linkedinProfileUrl: normalizeLinkedInUrl(pickValue(row, aliases.linkedinProfileUrl)),
      source,
    }))
    .filter((row) => row.firstName || row.lastName || row.company || row.linkedinProfileUrl)
}

export function parseCsvRows(csv: string) {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(current)
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      row.push(current)
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
      current = ''
      continue
    }

    current += char
  }

  row.push(current)
  if (row.some((cell) => cell.trim())) rows.push(row)

  const [headers, ...dataRows] = rows
  if (!headers) return []

  return dataRows.map((dataRow) =>
    Object.fromEntries(headers.map((header, index) => [header, dataRow[index] || '']))
  )
}
