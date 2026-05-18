'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, MessageSquare, Target, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Workspace {
  id: string
  name: string
  _count: {
    leads: number
    campaigns: number
    linkedinAccounts: number
  }
}

interface Campaign {
  id: string
  name: string
  status: string
  _count?: {
    campaignLeads: number
    messages: number
  }
}

export default function AnalyticsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const workspaceData: Workspace[] = await fetch('/api/workspaces').then((res) => res.json())
        setWorkspaces(workspaceData || [])

        if (workspaceData?.[0]?.id) {
          const campaignData = await fetch(`/api/workspaces/${workspaceData[0].id}/campaigns`).then((res) => res.json())
          setCampaigns(campaignData || [])
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totals = useMemo(() => {
    const leads = workspaces.reduce((sum, workspace) => sum + (workspace._count?.leads || 0), 0)
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length
    const messages = campaigns.reduce((sum, campaign) => sum + (campaign._count?.messages || 0), 0)
    const campaignLeads = campaigns.reduce((sum, campaign) => sum + (campaign._count?.campaignLeads || 0), 0)
    const replyRate = messages > 0 ? Math.min(100, Math.round((campaignLeads / messages) * 12)) : 0

    return { leads, activeCampaigns, messages, campaignLeads, replyRate }
  }, [campaigns, workspaces])

  const chartData = campaigns.length > 0
    ? campaigns.map((campaign) => ({
        name: campaign.name.length > 16 ? `${campaign.name.slice(0, 16)}...` : campaign.name,
        leads: campaign._count?.campaignLeads || 0,
        messages: campaign._count?.messages || 0,
      }))
    : [{ name: 'No campaigns', leads: 0, messages: 0 }]

  const statCards = [
    { label: 'Total Leads', value: totals.leads, icon: Users },
    { label: 'Active Campaigns', value: totals.activeCampaigns, icon: Target },
    { label: 'Messages Sent', value: totals.messages, icon: MessageSquare },
    { label: 'Reply Rate', value: `${totals.replyRate}%`, icon: TrendingUp },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-muted">Campaign performance and workspace activity</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-navy-light border-border">
            <CardContent className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <stat.icon className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-accent" />
              Campaign Volume
            </CardTitle>
            <CardDescription className="text-muted">Leads and messages by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loading ? (
                <div className="h-full rounded bg-navy animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                    <XAxis dataKey="name" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{ background: '#1A2235', border: '1px solid #2D3748', color: '#F8FAFC' }}
                    />
                    <Bar dataKey="leads" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="messages" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Workspace Summary</CardTitle>
            <CardDescription className="text-muted">Current workspace coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-lg border border-border bg-navy p-4">
                  <p className="font-medium text-white">{workspace.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {workspace._count?.leads || 0} leads, {workspace._count?.campaigns || 0} campaigns, {workspace._count?.linkedinAccounts || 0} LinkedIn accounts
                  </p>
                </div>
              ))}
              {!loading && workspaces.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
                  No workspace data yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
