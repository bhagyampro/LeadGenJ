'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { mapLeadImportRows } from '@/lib/lead-import'
import { Plus, Search, Filter, Download, Upload, Compass, Trash2, Edit3 } from 'lucide-react'

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  title: string | null
  company: string | null
  industry: string | null
  location: string | null
  linkedinProfileUrl?: string | null
  icpScore: number | null
  status: string
  source: string
  createdAt: string
}

interface Workspace {
  id: string
  name: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importRows, setImportRows] = useState<Array<Record<string, string>>>([])
  const [importMessage, setImportMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    industry: '',
    location: '',
    linkedinProfileUrl: '',
  })
  const [editingLead, setEditingLead] = useState({
    id: '',
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    industry: '',
    location: '',
    linkedinProfileUrl: '',
    status: 'new',
  })

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      setWorkspaces(data || [])
      if (data?.length > 0) {
        setSelectedWorkspace(data[0].id)
      }
    }
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (!selectedWorkspace) return

    const fetchLeads = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/leads`)
        const data = await res.json()
        setLeads(data.leads || [])
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [selectedWorkspace])

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      })

      if (res.ok) {
        const lead = await res.json()
        setLeads([lead, ...leads])
        setIsAddOpen(false)
        setNewLead({
          firstName: '',
          lastName: '',
          title: '',
          company: '',
          industry: '',
          location: '',
          linkedinProfileUrl: '',
        })
      }
    } catch (error) {
      console.error('Error adding lead:', error)
    }
  }

  const openEditLead = (lead: Lead) => {
    setEditingLead({
      id: lead.id,
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      title: lead.title || '',
      company: lead.company || '',
      industry: lead.industry || '',
      location: lead.location || '',
      linkedinProfileUrl: lead.linkedinProfileUrl || '',
      status: lead.status || 'new',
    })
    setIsEditOpen(true)
  }

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch(`/api/leads/${editingLead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: editingLead.firstName,
        lastName: editingLead.lastName,
        title: editingLead.title,
        company: editingLead.company,
        industry: editingLead.industry,
        location: editingLead.location,
        linkedinProfileUrl: editingLead.linkedinProfileUrl,
        status: editingLead.status,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setLeads(leads.map((lead) => (lead.id === updated.id ? updated : lead)))
      setIsEditOpen(false)
    }
  }

  const handleImportFile = async (file: File) => {
    setImportMessage('')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const mapped = mapLeadImportRows(rows).slice(0, 500)
    setImportRows(mapped)
    setImportMessage(mapped.length ? `Previewing ${mapped.length} leads from ${file.name}.` : 'No usable leads found in this file.')
  }

  const handleBulkImport = async () => {
    if (!selectedWorkspace || importRows.length === 0) return
    setImporting(true)
    setImportMessage('')

    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/leads/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: importRows }),
      })
      const data = await res.json()

      if (!res.ok) {
        setImportMessage(data.error || 'Import failed.')
        return
      }

      setLeads([...(data.leads || []), ...leads])
      setImportMessage(`Imported ${data.imported || 0} leads.`)
      setImportRows([])
    } catch (error) {
      console.error('Import error:', error)
      setImportMessage('Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((current) => {
      const next = new Set(current)
      if (next.has(leadId)) {
        next.delete(leadId)
      } else {
        next.add(leadId)
      }
      return next
    })
  }

  const toggleAllFiltered = () => {
    setSelectedLeadIds((current) => {
      const allSelected = filteredLeads.length > 0 && filteredLeads.every((lead) => current.has(lead.id))
      return allSelected ? new Set() : new Set(filteredLeads.map((lead) => lead.id))
    })
  }

  const deleteLead = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
    if (res.ok) {
      setLeads(leads.filter((lead) => lead.id !== leadId))
      setSelectedLeadIds((current) => {
        const next = new Set(current)
        next.delete(leadId)
        return next
      })
    }
  }

  const bulkDelete = async (deleteAll = false) => {
    const ids = Array.from(selectedLeadIds)
    if (!deleteAll && ids.length === 0) return
    const message = deleteAll ? 'Delete all leads in this workspace?' : `Delete ${ids.length} selected leads?`
    if (!confirm(message)) return

    const res = await fetch(`/api/workspaces/${selectedWorkspace}/leads/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, deleteAll }),
    })

    if (res.ok) {
      setLeads(deleteAll ? [] : leads.filter((lead) => !selectedLeadIds.has(lead.id)))
      setSelectedLeadIds(new Set())
    }
  }

  const handleGoogleSheetImport = async () => {
    if (!selectedWorkspace || !sheetUrl.trim()) {
      setImportMessage('Paste a Google Sheets URL first.')
      return
    }

    setImporting(true)
    setImportMessage('')

    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/leads/import-google-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      })
      const data = await res.json()

      if (!res.ok) {
        setImportMessage(data.error || 'Google Sheet import failed.')
        return
      }

      setLeads([...(data.leads || []), ...leads])
      setImportMessage(`Imported ${data.imported || 0} leads from Google Sheets.`)
      setSheetUrl('')
    } catch (error) {
      console.error('Google Sheet import error:', error)
      setImportMessage('Google Sheet import failed.')
    } finally {
      setImporting(false)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase()
    return (
      lead.firstName?.toLowerCase().includes(query) ||
      lead.lastName?.toLowerCase().includes(query) ||
      lead.company?.toLowerCase().includes(query) ||
      lead.title?.toLowerCase().includes(query)
    )
  })

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-500'
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Leads</h1>
          <p className="text-muted mt-1">Manage your lead database</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="px-3 py-2 rounded-lg bg-navy-light border border-border text-white"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-navy-light border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Import Leads</DialogTitle>
                <DialogDescription className="text-muted">
                  Upload CSV, TSV, XLS, or XLSX files exported from your CRM, spreadsheet, or approved lead source.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sheetUrl" className="text-white">Google Sheets URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sheetUrl"
                      value={sheetUrl}
                      onChange={(event) => setSheetUrl(event.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="bg-navy border-border"
                    />
                    <Button onClick={handleGoogleSheetImport} disabled={importing || !sheetUrl.trim()}>
                      Connect
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    Share the sheet publicly or publish it to CSV. Headers can be first name, last name, title, company, industry, country, LinkedIn URL.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase text-muted">or upload file</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadImportFile" className="text-white">Spreadsheet File</Label>
                  <Input
                    id="leadImportFile"
                    type="file"
                    accept=".csv,.tsv,.xls,.xlsx"
                    className="bg-navy border-border"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handleImportFile(file)
                    }}
                  />
                </div>
                {importMessage && (
                  <div className="rounded-lg border border-border bg-navy px-4 py-3 text-sm text-muted">
                    {importMessage}
                  </div>
                )}
                {importRows.length > 0 && (
                  <div className="max-h-72 overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted">Name</TableHead>
                          <TableHead className="text-muted">Title</TableHead>
                          <TableHead className="text-muted">Company</TableHead>
                          <TableHead className="text-muted">Industry</TableHead>
                          <TableHead className="text-muted">LinkedIn</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importRows.slice(0, 10).map((row, index) => (
                          <TableRow key={`${row.linkedinProfileUrl}-${index}`} className="border-border">
                            <TableCell className="text-white">{row.firstName} {row.lastName}</TableCell>
                            <TableCell className="text-muted">{row.title}</TableCell>
                            <TableCell className="text-muted">{row.company}</TableCell>
                            <TableCell className="text-muted">{row.industry}</TableCell>
                            <TableCell className="text-muted">{row.linkedinProfileUrl || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleBulkImport} disabled={importing || importRows.length === 0}>
                  {importing ? 'Importing...' : `Import ${importRows.length} Leads`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <a href="/dashboard/lead-finder">
              <Compass className="w-4 h-4 mr-2" />
              Lead Finder
            </a>
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-light border-border">
              <form onSubmit={handleAddLead}>
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Lead</DialogTitle>
                  <DialogDescription className="text-muted">
                    Enter the lead details below
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        value={newLead.firstName}
                        onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                        className="bg-navy border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newLead.lastName}
                        onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                        className="bg-navy border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <Input
                      id="title"
                      value={newLead.title}
                      onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                      className="bg-navy border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-white">Company</Label>
                    <Input
                      id="company"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      className="bg-navy border-border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-white">Industry</Label>
                      <Input
                        id="industry"
                        value={newLead.industry}
                        onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                        className="bg-navy border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">Location</Label>
                      <Input
                        id="location"
                        value={newLead.location}
                        onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                        className="bg-navy border-border"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Lead</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-navy-light border-border">
          <form onSubmit={handleEditLead}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit Lead</DialogTitle>
              <DialogDescription className="text-muted">
                Update lead details, status, and LinkedIn profile URL.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className="text-white">First Name</Label>
                  <Input id="edit-firstName" value={editingLead.firstName} onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })} className="bg-navy border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className="text-white">Last Name</Label>
                  <Input id="edit-lastName" value={editingLead.lastName} onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })} className="bg-navy border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-white">Title</Label>
                <Input id="edit-title" value={editingLead.title} onChange={(e) => setEditingLead({ ...editingLead, title: e.target.value })} className="bg-navy border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company" className="text-white">Company</Label>
                <Input id="edit-company" value={editingLead.company} onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })} className="bg-navy border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-industry" className="text-white">Industry</Label>
                  <Input id="edit-industry" value={editingLead.industry} onChange={(e) => setEditingLead({ ...editingLead, industry: e.target.value })} className="bg-navy border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location" className="text-white">Location</Label>
                  <Input id="edit-location" value={editingLead.location} onChange={(e) => setEditingLead({ ...editingLead, location: e.target.value })} className="bg-navy border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-linkedin" className="text-white">LinkedIn URL</Label>
                <Input id="edit-linkedin" value={editingLead.linkedinProfileUrl} onChange={(e) => setEditingLead({ ...editingLead, linkedinProfileUrl: e.target.value })} className="bg-navy border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-white">Status</Label>
                <select
                  id="edit-status"
                  value={editingLead.status}
                  onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-border text-white"
                >
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="contacted">Contacted</option>
                  <option value="replied">Replied</option>
                  <option value="not_fit">Not Fit</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Lead</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-navy-light border-border"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" onClick={() => bulkDelete(false)} disabled={selectedLeadIds.size === 0}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Selected
        </Button>
        <Button variant="destructive" onClick={() => bulkDelete(true)} disabled={leads.length === 0}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete All
        </Button>
      </div>

      {/* Leads Table */}
      <Card className="bg-navy-light border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted w-10">
                  <input
                    type="checkbox"
                    checked={filteredLeads.length > 0 && filteredLeads.every((lead) => selectedLeadIds.has(lead.id))}
                    onChange={toggleAllFiltered}
                    aria-label="Select all filtered leads"
                  />
                </TableHead>
                <TableHead className="text-muted">Name</TableHead>
                <TableHead className="text-muted">Title</TableHead>
                <TableHead className="text-muted">Company</TableHead>
                <TableHead className="text-muted">Industry</TableHead>
                <TableHead className="text-muted">LinkedIn</TableHead>
                <TableHead className="text-muted">ICP Score</TableHead>
                <TableHead className="text-muted">Status</TableHead>
                <TableHead className="text-muted">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted">
                    No leads found. Add your first lead to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-border">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.has(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        aria-label={`Select ${lead.firstName || ''} ${lead.lastName || ''}`}
                      />
                    </TableCell>
                    <TableCell className="text-white">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell className="text-muted">{lead.title}</TableCell>
                    <TableCell className="text-muted">{lead.company}</TableCell>
                    <TableCell className="text-muted">{lead.industry}</TableCell>
                    <TableCell>
                      {lead.linkedinProfileUrl ? (
                        <a
                          href={lead.linkedinProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          Profile
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.icpScore !== null ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getScoreColor(lead.icpScore)}`}>
                          {lead.icpScore}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-muted">
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openEditLead(lead)}>
                        <Edit3 className="w-4 h-4 text-accent" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLead(lead.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
