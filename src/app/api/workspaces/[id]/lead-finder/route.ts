import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const industryTitles: Record<string, string[]> = {
  all_industries: ['Founder', 'CEO', 'Head of Sales', 'Operations Director', 'Business Development Manager'],
  saas: ['Founder', 'Head of Sales', 'Revenue Operations Manager', 'VP Growth', 'Sales Director'],
  ai: ['AI Founder', 'Machine Learning Lead', 'Head of Product', 'Data Science Manager', 'Automation Consultant'],
  real_estate: ['Broker Owner', 'Real Estate Investor', 'Managing Broker', 'Leasing Director', 'Property Manager'],
  recruitment: ['Talent Acquisition Lead', 'Recruitment Manager', 'Agency Founder', 'HR Director', 'Sourcing Lead'],
  marketing: ['Marketing Director', 'Agency Owner', 'Demand Generation Manager', 'Growth Marketer', 'Performance Lead'],
  local_business: ['Owner', 'General Manager', 'Operations Manager', 'Business Development Manager', 'Franchise Owner'],
  ecommerce: ['Ecommerce Director', 'Marketplace Manager', 'DTC Founder', 'Growth Lead', 'Retention Manager'],
  finance: ['Finance Director', 'Wealth Advisor', 'Managing Partner', 'Fintech Founder', 'Operations Lead'],
  healthcare: ['Clinic Director', 'Healthcare Administrator', 'Practice Owner', 'Medtech Founder', 'Patient Growth Lead'],
  education: ['Admissions Director', 'Edtech Founder', 'Training Manager', 'Program Director', 'Partnerships Lead'],
  manufacturing: ['Plant Manager', 'Operations Director', 'Supply Chain Lead', 'Manufacturing Owner', 'Procurement Manager'],
  logistics: ['Logistics Manager', 'Fleet Owner', 'Supply Chain Director', 'Warehouse Operations Lead', '3PL Founder'],
  consulting: ['Principal Consultant', 'Managing Partner', 'Strategy Consultant', 'Business Consultant', 'Practice Lead'],
  legal: ['Managing Partner', 'Legal Operations Manager', 'Law Firm Owner', 'Client Development Lead', 'Practice Director'],
  hospitality: ['Hotel General Manager', 'Restaurant Owner', 'Hospitality Director', 'Events Lead', 'Guest Experience Manager'],
  construction: ['Construction Owner', 'Project Director', 'General Contractor', 'Development Manager', 'Operations Lead'],
  insurance: ['Insurance Agency Owner', 'Broker Principal', 'Claims Operations Lead', 'Risk Advisor', 'Producer Manager'],
}

const companies: Record<string, string[]> = {
  all_industries: ['GrowthWorks', 'Vertex Partners', 'BluePeak Group', 'ScalePoint', 'Orbit Ventures'],
  saas: ['Northstar CRM', 'PipelineIQ', 'CloudDesk', 'RevenueGrid', 'StackPilot'],
  ai: ['AgentFlow AI', 'ModelWorks', 'PromptOps', 'NeuralDesk', 'Automata Labs'],
  real_estate: ['MetroKey Realty', 'UrbanNest Group', 'PrimeLot Partners', 'EstateFlow', 'Skyline Properties'],
  recruitment: ['TalentBridge', 'HireLoop', 'PeopleScale', 'RecruitEdge', 'SourceWorks'],
  marketing: ['SignalReach', 'GrowthCraft', 'MarketNest', 'ClickForge', 'BrandLift'],
  local_business: ['CityWorks', 'LocalPro Services', 'MainStreet Group', 'TradeHub', 'Neighborhood Co'],
  ecommerce: ['ShopPilot', 'CartLift', 'DTC Forge', 'MarketLane', 'RetailNest'],
  finance: ['CapitalBridge', 'FinEdge', 'WealthGrid', 'LedgerPoint', 'VaultWorks'],
  healthcare: ['CareBridge', 'ClinicFlow', 'MedReach', 'HealthStack', 'PracticePilot'],
  education: ['LearnGrid', 'CampusFlow', 'SkillBridge', 'EdPilot', 'AcademyWorks'],
  manufacturing: ['FactoryFlow', 'BuildLine', 'MfgWorks', 'SteelBridge', 'SupplyPilot'],
  logistics: ['RouteGrid', 'FleetFlow', 'CargoPoint', 'ShipNest', 'WarehouseIQ'],
  consulting: ['AdvisoryGrid', 'StrategyWorks', 'ScaleBridge', 'ConsultPilot', 'InsightLane'],
  legal: ['LawBridge', 'CaseFlow', 'LegalNest', 'CounselGrid', 'PracticePoint'],
  hospitality: ['StayPilot', 'VenueWorks', 'GuestGrid', 'TableFlow', 'HotelNest'],
  construction: ['BuildPoint', 'SiteFlow', 'ConstructGrid', 'ProjectNest', 'ContractorWorks'],
  insurance: ['PolicyBridge', 'RiskFlow', 'InsureGrid', 'BrokerNest', 'ClaimPilot'],
}

const firstNames = ['Aarav', 'Maya', 'Rohan', 'Nisha', 'Vikram', 'Priya', 'Arjun', 'Sara', 'Dev', 'Anika']
const lastNames = ['Sharma', 'Patel', 'Mehta', 'Kapoor', 'Rao', 'Iyer', 'Singh', 'Gupta', 'Nair', 'Khan']
const countryDomains: Record<string, string> = {
  'United States': 'com',
  Canada: 'ca',
  'United Kingdom': 'co.uk',
  Australia: 'com.au',
  India: 'in',
  Germany: 'de',
  France: 'fr',
  Spain: 'es',
  Italy: 'it',
  Netherlands: 'nl',
  Singapore: 'sg',
  'United Arab Emirates': 'ae',
  Brazil: 'com.br',
  Mexico: 'com.mx',
  Japan: 'jp',
}

function normalizeCategory(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'saas'
}

function generateLeads(categoryInput: string, location: string, count: number) {
  const category = normalizeCategory(categoryInput)
  const titles = industryTitles[category] || industryTitles.all_industries
  const companyList = companies[category] || companies.all_industries
  const safeCount = Math.min(Math.max(count || 10, 1), 50)
  const safeLocation = location || 'United States'
  const domain = countryDomains[safeLocation] || 'com'

  return Array.from({ length: safeCount }).map((_, index) => {
    const firstName = firstNames[index % firstNames.length]
    const lastName = lastNames[(index + 3) % lastNames.length]
    const company = companyList[index % companyList.length]
    const title = titles[index % titles.length]
    const slug = `${firstName}-${lastName}-${category}-${index + 1}`.toLowerCase()
    const companyDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '')
    const connectionCount = 200 + ((index + 1) * 137) % 4800

    return {
      firstName,
      lastName,
      title,
      company,
      industry: categoryInput,
      location: safeLocation,
      linkedinProfileUrl: `https://www.linkedin.com/in/${slug}`,
      emailAddress: `${firstName}.${lastName}@${companyDomain}.${domain}`.toLowerCase(),
      phoneNumber: `+1-555-${String(1000 + index).slice(-4)}`,
      connectionCount,
      source: 'lead_finder_demo',
      icpScore: Math.max(55, 92 - index * 3),
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: workspaceId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const body = await request.json()
    const category = String(body.category || 'SaaS')
    const location = String(body.location || 'United States')
    const count = Number(body.count || 10)
    const importLeads = Boolean(body.importLeads)
    const leads = generateLeads(category, location, count)

    if (!importLeads) {
      return NextResponse.json({ leads, imported: 0 })
    }

    const urls = leads.map((lead) => lead.linkedinProfileUrl)
    const existing = await prisma.lead.findMany({
      where: { workspaceId, linkedinProfileUrl: { in: urls } },
      select: { linkedinProfileUrl: true },
    })
    const existingUrls = new Set(existing.map((lead) => lead.linkedinProfileUrl))
    const leadsToCreate = leads.filter((lead) => !existingUrls.has(lead.linkedinProfileUrl))

    const created = leadsToCreate.length
      ? await prisma.lead.createManyAndReturn({
          data: leadsToCreate.map((lead) => ({
            workspaceId,
            firstName: lead.firstName,
            lastName: lead.lastName,
            title: lead.title,
            company: lead.company,
            industry: lead.industry,
            location: lead.location,
            linkedinProfileUrl: lead.linkedinProfileUrl,
            source: lead.source,
            icpScore: lead.icpScore,
            emailEnriched: lead.emailAddress,
            phoneEnriched: lead.phoneNumber,
            customAttributes: {
              connectionCount: lead.connectionCount,
              sourceProfileUrl: lead.linkedinProfileUrl,
              leadFinderCategory: category,
              country: location,
            },
            status: 'new',
            icpBreakdown: {
              title: lead.icpScore,
              company: Math.max(50, lead.icpScore - 6),
              industry: 90,
              location: 75,
            },
          })),
        })
      : []

    return NextResponse.json({
      leads,
      imported: created.length,
      skipped: leads.length - created.length,
      created,
    })
  } catch (error) {
    console.error('Lead finder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
