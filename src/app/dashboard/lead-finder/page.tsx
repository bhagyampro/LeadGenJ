'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Upload, Wand2 } from 'lucide-react'

interface Workspace {
  id: string
  name: string
}

interface PreviewLead {
  firstName: string
  lastName: string
  title: string
  company: string
  industry: string
  location: string
  linkedinProfileUrl: string
  icpScore: number
}

const categories = [
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Recruitment', label: 'Recruitment' },
  { value: 'Marketing', label: 'Marketing Agencies' },
  { value: 'Local Business', label: 'Local Businesses' },
]

export default function LeadFinderPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [category, setCategory] = useState('SaaS')
  const [location, setLocation] = useState('United States')
  const [count, setCount] = useState(15)
  const [leads, setLeads] = useState<PreviewLead[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      setWorkspaces(data || [])
      if (data?.length > 0) setSelectedWorkspace(data[0].id)
    }

    fetchWorkspaces()
  }, [])

  const runFinder = async (importLeads = false) => {
    if (!selectedWorkspace) {
      setMessage('Select a workspace first.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/lead-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, location, count, importLeads }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Lead finder failed.')
        return
      }

      setLeads(data.leads || [])
      setMessage(importLeads ? `Imported ${data.imported} leads. Skipped ${data.skipped || 0} duplicates.` : 'Preview generated.')
    } catch (error) {
      console.error('Lead finder error:', error)
      setMessage('Lead finder failed.')
    } finally {
      setLoading(false)
    }
  }

  const createDemoCampaign = async () => {
    if (!selectedWorkspace) return

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/campaigns/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not create demo campaign.')
        return
      }

      setMessage(`Demo campaign created with ${data._count?.campaignLeads || 0} leads and ${data._count?.sequences || 0} steps.`)
    } catch (error) {
      console.error('Demo campaign error:', error)
      setMessage('Could not create demo campaign.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">Lead Finder</h1>
          <p className="mt-1 text-muted">Find and import category leads for compliant campaign testing</p>
        </div>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="rounded-lg border border-border bg-navy-light px-3 py-2 text-white"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      <Card className="mb-6 border-border bg-navy-light">
        <CardHeader>
          <CardTitle className="text-white">Category Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-white">Industry Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-navy px-3 text-white"
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-white">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-navy border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count" className="text-white">Lead Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="bg-navy border-border"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => runFinder(false)} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" onClick={() => runFinder(true)} disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
          {message && (
            <div className="mt-4 rounded-lg border border-border bg-navy px-4 py-3 text-sm text-muted">
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border text-muted">{leads.length} preview leads</Badge>
          <Badge variant="outline" className="border-border text-muted">{category}</Badge>
        </div>
        <Button onClick={createDemoCampaign} disabled={loading}>
          <Wand2 className="mr-2 h-4 w-4" />
          Create Demo Campaign
        </Button>
      </div>

      <Card className="border-border bg-navy-light">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted">Lead</TableHead>
                <TableHead className="text-muted">Title</TableHead>
                <TableHead className="text-muted">Company</TableHead>
                <TableHead className="text-muted">Location</TableHead>
                <TableHead className="text-muted">ICP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted">
                    Generate a preview to see category leads.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.linkedinProfileUrl} className="border-border">
                    <TableCell className="font-medium text-white">{lead.firstName} {lead.lastName}</TableCell>
                    <TableCell className="text-muted">{lead.title}</TableCell>
                    <TableCell className="text-muted">{lead.company}</TableCell>
                    <TableCell className="text-muted">{lead.location}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500 text-white">{lead.icpScore}</Badge>
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
