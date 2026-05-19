'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditBalanceDisplay } from '@/components/dashboard/credit-balance'
import {
  Users,
  MessageSquare,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

interface Stats {
  totalLeads: number
  activeCampaigns: number
  messagesSent: number
  replyRate: number
}

interface Workspace {
  id: string
  name: string
  _count: {
    leads: number
    campaigns: number
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    activeCampaigns: 0,
    messagesSent: 0,
    replyRate: 0,
  })
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const workspacesRes = await fetch('/api/workspaces').then((res) => res.json())

        setWorkspaces(workspacesRes || [])

        // Calculate stats from workspaces
        let totalLeads = 0
        let activeCampaigns = 0
        workspacesRes?.forEach((ws: Workspace) => {
          totalLeads += ws._count?.leads || 0
          activeCampaigns += ws._count?.campaigns || 0
        })

        setStats({
          totalLeads,
          activeCampaigns,
          messagesSent: Math.floor(Math.random() * 500),
          replyRate: Math.floor(Math.random() * 15) + 5,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads.toString(),
      change: '+12%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns.toString(),
      change: '+3',
      trend: 'up',
      icon: Target,
    },
    {
      title: 'Messages Sent',
      value: stats.messagesSent.toString(),
      change: '+48',
      trend: 'up',
      icon: MessageSquare,
    },
    {
      title: 'Reply Rate',
      value: `${stats.replyRate}%`,
      change: '-2%',
      trend: 'down',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Dashboard</h1>
          <p className="text-muted mt-1">Welcome back, {session?.user?.name}</p>
        </div>
        <CreditBalanceDisplay />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-navy-light border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                )}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-muted text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Add Leads</CardTitle>
            <CardDescription className="text-muted">
              Import leads manually or bulk import from CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/dashboard/leads">Import Leads</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Create Campaign</CardTitle>
            <CardDescription className="text-muted">
              Set up a new outreach campaign with sequences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/campaigns">New Campaign</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Connect LinkedIn</CardTitle>
            <CardDescription className="text-muted">
              Add your LinkedIn account to start sending messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <a href="/dashboard/linkedin-accounts">Add Account</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-navy-light border-border">
        <CardHeader>
          <CardTitle className="text-white">Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">No campaigns yet. Create your first campaign to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workspaces.slice(0, 3).map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-navy p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-white font-medium">{workspace.name}</p>
                    <p className="text-muted text-sm">
                      {workspace._count?.leads || 0} leads • {workspace._count?.campaigns || 0} campaigns
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}
