import { NextRequest, NextResponse } from 'next/server'
import { linkedinIndustries, linkedinRoles, leadFinderCountries } from '@/lib/lead-finder-options'

const optionSets = {
  industry: linkedinIndustries,
  role: linkedinRoles,
  country: leadFinderCountries,
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'industry'
  const query = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase()
  const options = optionSets[type as keyof typeof optionSets] || optionSets.industry

  const suggestions = options
    .filter((option) => option.toLowerCase().includes(query))
    .slice(0, 20)

  return NextResponse.json({ suggestions })
}
