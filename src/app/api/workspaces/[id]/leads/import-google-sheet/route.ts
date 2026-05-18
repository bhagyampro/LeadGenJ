import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { mapLeadImportRows, parseCsvRows } from '@/lib/lead-import'
import { prisma } from '@/lib/prisma'

function toGoogleCsvUrl(sheetUrl: string) {
  const url = new URL(sheetUrl)

  if (!url.hostname.includes('docs.google.com')) {
    throw new Error('Use a Google Sheets URL.')
  }

  const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)
  const spreadsheetId = match?.[1]
  if (!spreadsheetId) throw new Error('Could not read spreadsheet ID.')

  const gid = url.hash.match(/gid=(\d+)/)?.[1] || url.searchParams.get('gid') || '0'
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
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
    const sheetUrl = String(body.sheetUrl || '')
    const csvUrl = toGoogleCsvUrl(sheetUrl)
    const response = await fetch(csvUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Could not read this sheet. Make it public/shared or publish it as CSV first.' },
        { status: 400 }
      )
    }

    const csv = await response.text()
    const leads = mapLeadImportRows(parseCsvRows(csv), 'google_sheet_import').slice(0, 1000)

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No usable leads found in this sheet.' }, { status: 400 })
    }

    const createdLeads = await prisma.lead.createManyAndReturn({
      data: leads.map((lead) => ({
        workspaceId,
        ...lead,
        status: 'new',
      })),
    })

    return NextResponse.json({ imported: createdLeads.length, leads: createdLeads })
  } catch (error) {
    console.error('Google Sheet import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google Sheet import failed.' },
      { status: 500 }
    )
  }
}
