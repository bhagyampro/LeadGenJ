'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Search, Filter, Download, Upload, Compass } from 'lucide-react'

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  title: string | null
  company: string | null
  industry: string | null
  location: string | null
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
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    industry: '',
    location: '',
    linkedinProfileUrl: '',
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
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
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
      </div>

      {/* Leads Table */}
      <Card className="bg-navy-light border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted">Name</TableHead>
                <TableHead className="text-muted">Title</TableHead>
                <TableHead className="text-muted">Company</TableHead>
                <TableHead className="text-muted">Industry</TableHead>
                <TableHead className="text-muted">ICP Score</TableHead>
                <TableHead className="text-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted">
                    No leads found. Add your first lead to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-border">
                    <TableCell className="text-white">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell className="text-muted">{lead.title}</TableCell>
                    <TableCell className="text-muted">{lead.company}</TableCell>
                    <TableCell className="text-muted">{lead.industry}</TableCell>
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
