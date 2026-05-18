'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { linkedinIndustries, linkedinRoles, leadFinderCountries } from '@/lib/lead-finder-options'
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
  emailAddress: string
  phoneNumber: string
  connectionCount: number
  icpScore: number
}

type SuggestionType = 'industry' | 'role' | 'country'

function SearchSelect({
  label,
  value,
  type,
  fallback,
  onChange,
}: {
  label: string
  value: string
  type: SuggestionType
  fallback: string[]
  onChange: (value: string) => void
}) {
  const [suggestions, setSuggestions] = useState(fallback.slice(0, 10))
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const res = await fetch(`/api/lead-finder/suggestions?type=${type}&q=${encodeURIComponent(value)}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setActiveIndex(-1)
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [type, value])

  return (
    <div className="relative z-50 space-y-2">
      <Label className="text-white">{label}</Label>
      <Input
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            setOpen(true)
            return
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1))
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) => Math.max(current - 1, 0))
          }

          if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
            event.preventDefault()
            onChange(suggestions[activeIndex])
            setOpen(false)
          }

          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        className="bg-navy border-border"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-[100] mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-navy-light shadow-2xl ring-1 ring-black/40">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`block w-full px-3 py-2 text-left text-sm text-white ${
                index === activeIndex ? 'bg-secondary' : 'hover:bg-secondary'
              }`}
              onPointerDown={(event) => {
                event.preventDefault()
                onChange(suggestion)
                setOpen(false)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LeadFinderPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [category, setCategory] = useState('SaaS')
  const [role, setRole] = useState('Founder')
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
        body: JSON.stringify({ category, role, location, count, importLeads }),
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
          <div className="grid gap-4 md:grid-cols-5">
            <SearchSelect
              label="Industry"
              type="industry"
              value={category}
              fallback={linkedinIndustries}
              onChange={setCategory}
            />
            <SearchSelect
              label="Role / Title"
              type="role"
              value={role}
              fallback={linkedinRoles}
              onChange={setRole}
            />
            <SearchSelect
              label="Country"
              type="country"
              value={location}
              fallback={leadFinderCountries}
              onChange={setLocation}
            />
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
                <TableHead className="text-muted">Email</TableHead>
                <TableHead className="text-muted">Phone</TableHead>
                <TableHead className="text-muted">Connections</TableHead>
                <TableHead className="text-muted">LinkedIn</TableHead>
                <TableHead className="text-muted">ICP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted">
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
                    <TableCell className="text-muted">{lead.emailAddress}</TableCell>
                    <TableCell className="text-muted">{lead.phoneNumber}</TableCell>
                    <TableCell className="text-muted">{lead.connectionCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <a
                        href={lead.linkedinProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        Profile
                      </a>
                    </TableCell>
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
