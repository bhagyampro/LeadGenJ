'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Play, Pause, Copy, Trash2 } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
  linkedinAccountId: string | null
  linkedinAccount?: { id: string; name: string }
  createdAt: string
  _count: {
    sequences: number
    campaignLeads: number
    messages: number
  }
}

interface Workspace {
  id: string
  name: string
}

interface LinkedInAccount {
  id: string
  name: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    linkedinAccountId: '',
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

    const fetchData = async () => {
      setLoading(true)
      try {
        const [campaignsRes, accountsRes] = await Promise.all([
          fetch(`/api/workspaces/${selectedWorkspace}/campaigns`),
          fetch(`/api/workspaces/${selectedWorkspace}/linkedin-accounts`),
        ])
        const campaignsData = await campaignsRes.json()
        const accountsData = await accountsRes.json()
        setCampaigns(campaignsData || [])
        setLinkedInAccounts(accountsData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedWorkspace])

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      })

      if (res.ok) {
        const campaign = await res.json()
        setCampaigns([campaign, ...campaigns])
        setIsAddOpen(false)
        setNewCampaign({ name: '', linkedinAccountId: '' })
      }
    } catch (error) {
      console.error('Error adding campaign:', error)
    }
  }

  const handleStatusChange = async (campaignId: string, action: 'activate' | 'pause' | 'resume') => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        setCampaigns(campaigns.map((c) => (c.id === campaignId ? { ...c, status: updated.status } : c)))
      }
    } catch (error) {
      console.error(`Error ${action} campaign:`, error)
    }
  }

  const handleDuplicate = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/duplicate`, { method: 'POST' })
      if (res.ok) {
        const campaign = await res.json()
        setCampaigns([campaign, ...campaigns])
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error)
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
      if (res.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== campaignId))
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'draft':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Campaigns</h1>
          <p className="text-muted mt-1">Manage your outreach campaigns</p>
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
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-light border-border">
              <form onSubmit={handleAddCampaign}>
                <DialogHeader>
                  <DialogTitle className="text-white">Create Campaign</DialogTitle>
                  <DialogDescription className="text-muted">
                    Set up a new outreach campaign
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Campaign Name</Label>
                    <Input
                      id="name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Q1 Outreach - Enterprise"
                      className="bg-navy border-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinAccount" className="text-white">LinkedIn Account</Label>
                    <select
                      id="linkedinAccount"
                      value={newCampaign.linkedinAccountId}
                      onChange={(e) => setNewCampaign({ ...newCampaign, linkedinAccountId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-navy border border-border text-white"
                    >
                      <option value="">Select account...</option>
                      {linkedInAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Campaign</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-navy-light border-border">
              <CardContent className="p-6">
                <div className="h-6 w-32 bg-navy rounded animate-pulse mb-4" />
                <div className="h-4 w-24 bg-navy rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : campaigns.length === 0 ? (
          <Card className="bg-navy-light border-border col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-muted mb-4">No campaigns yet. Create your first campaign to start reaching out.</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-navy-light border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white text-lg">{campaign.name}</CardTitle>
                  <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Steps</span>
                    <span className="text-white">{campaign._count?.sequences || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Leads</span>
                    <span className="text-white">{campaign._count?.campaignLeads || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Messages</span>
                    <span className="text-white">{campaign._count?.messages || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(campaign.id, 'activate')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  {campaign.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(campaign.id, 'pause')}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {campaign.status === 'paused' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(campaign.id, 'resume')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(campaign.id)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(campaign.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
