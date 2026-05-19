'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Copy, Edit3, Pause, Play, Save, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

interface Sequence {
  id: string
  name: string
  stepOrder: number
  waitDays: number
  messageTemplate: string
  actionType: string
  aiAssisted: boolean
}

interface CampaignLead {
  lead: {
    id: string
    firstName: string | null
    lastName: string | null
    title: string | null
    company: string | null
  }
  status: string
  currentStep: number
  nextMessageDate: string | null
  lastMessageSent: string | null
  lastError: string | null
}

interface Campaign {
  id: string
  name: string
  status: string
  linkedinAccount?: { id: string; name: string } | null
  sequences: Sequence[]
  campaignLeads: CampaignLead[]
  _count: {
    messages: number
    campaignLeads: number
  }
}

const demoMessages = [
  'Hi {{firstName}}, I noticed your work as {{title}} at {{company}}. I help teams improve lead quality and outreach relevance before campaigns go live. Would it be worth sharing a short example?',
  'Hi {{firstName}}, {{company}} looks active in {{industry}}. We help teams identify stronger-fit prospects and personalize outreach at scale. Open to a quick conversation?',
  'Hi {{firstName}}, I saw your role at {{company}} and thought there may be a fit. We help teams reduce generic outreach by scoring leads and tailoring messages before sending.',
  'Hi {{firstName}}, are you currently reviewing ways to improve outbound targeting or reply quality at {{company}}? I can share a concise workflow if helpful.',
  'Hi {{firstName}}, I work with teams that want cleaner prospect lists and more relevant LinkedIn outreach. Given your work at {{company}}, I thought this may be relevant.',
  'Hi {{firstName}}, I noticed {{company}} in the {{industry}} space. We help teams prioritize prospects, personalize first touches, and keep campaign execution organized.',
  'Hi {{firstName}}, quick question: is improving lead qualification or outbound personalization a current priority for your team at {{company}}?',
  'Hi {{firstName}}, I came across your profile and thought our lead scoring and campaign workflow could be useful for {{company}}. Should I send over a brief overview?',
  'Hi {{firstName}}, many {{industry}} teams are trying to make outreach more targeted without adding manual work. We built a simple way to support that.',
  'Hi {{firstName}}, if {{company}} is exploring better outbound workflows, I would be glad to share how teams use ICP scoring and message personalization together.',
]

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [draftStep, setDraftStep] = useState({
    id: '',
    name: '',
    waitDays: 1,
    actionType: 'connection_request',
    messageTemplate: demoMessages[0],
  })

  const fetchCampaign = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`)
      const data = await res.json()
      setCampaign(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadCampaign = async () => {
      if (!campaignId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`)
        const data = await res.json()
        if (!cancelled) setCampaign(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCampaign()
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const progress = useMemo(() => {
    if (!campaign) return 0
    const totalLeads = campaign._count?.campaignLeads || 0
    const totalSteps = campaign.sequences.length
    if (totalLeads === 0 || totalSteps === 0) return 0
    const completedUnits = campaign.campaignLeads.reduce((sum, item) => {
      return sum + Math.min(item.currentStep || 0, totalSteps)
    }, 0)
    return Math.round((completedUnits / (totalLeads * totalSteps)) * 100)
  }, [campaign])

  const resetDraft = () => {
    setDraftStep({
      id: '',
      name: '',
      waitDays: 1,
      actionType: 'connection_request',
      messageTemplate: demoMessages[0],
    })
  }

  const editStep = (step: Sequence) => {
    setDraftStep({
      id: step.id,
      name: step.name,
      waitDays: step.waitDays,
      actionType: step.actionType || 'message',
      messageTemplate: step.messageTemplate,
    })
  }

  const saveStep = async (event: React.FormEvent) => {
    event.preventDefault()
    setFeedback('')

    const isEdit = Boolean(draftStep.id)
    const endpoint = isEdit ? `/api/sequences/${draftStep.id}` : `/api/campaigns/${campaignId}/sequences`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draftStep.name,
        waitDays: draftStep.waitDays,
        actionType: draftStep.actionType,
        messageTemplate: draftStep.messageTemplate,
        aiAssisted: false,
      }),
    })

    if (res.ok) {
      setFeedback(isEdit ? 'Step updated.' : 'Step added.')
      resetDraft()
      await fetchCampaign(false)
    } else {
      const data = await res.json()
      setFeedback(data.error || 'Unable to save step.')
    }
  }

  const deleteStep = async (stepId: string) => {
    if (!confirm('Delete this campaign step?')) return
    const res = await fetch(`/api/sequences/${stepId}`, { method: 'DELETE' })
    if (res.ok) {
      setFeedback('Step deleted.')
      await fetchCampaign(false)
    }
  }

  const changeStatus = async (action: 'activate' | 'pause' | 'resume') => {
    const res = await fetch(`/api/campaigns/${campaignId}/${action}`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setCampaign((current) => current ? { ...current, status: data.status } : current)
      setFeedback(`Campaign ${data.status}.`)
    } else {
      setFeedback(data.error || `Unable to ${action} campaign.`)
    }
  }

  const changeLeadStatus = async (leadId: string, event: 'accepted' | 'replied' | 'failed') => {
    const res = await fetch(`/api/campaigns/${campaignId}/leads/${leadId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
    })
    const data = await res.json()
    if (res.ok) {
      setFeedback(event === 'accepted' ? 'Acceptance recorded and next step scheduled.' : `Lead marked ${event}.`)
      await fetchCampaign(false)
    } else {
      setFeedback(data.error || 'Unable to update lead status.')
    }
  }

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setFeedback('Copied message.')
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-80 rounded-lg bg-navy-light animate-pulse" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="bg-navy-light border-border">
          <CardContent className="p-8 text-muted">Campaign not found.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/dashboard/campaigns" className="text-sm text-accent hover:underline">Back to campaigns</Link>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white">{campaign.name}</h1>
          <p className="mt-1 text-muted">
            {campaign.linkedinAccount?.name || 'No LinkedIn account selected'} • {campaign._count?.campaignLeads || 0} leads • {campaign._count?.messages || 0} messages
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="capitalize">{campaign.status}</Badge>
          {campaign.status === 'active' ? (
            <Button variant="outline" onClick={() => changeStatus('pause')}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : campaign.status === 'paused' ? (
            <Button onClick={() => changeStatus('resume')}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button onClick={() => changeStatus('activate')}>
              <Play className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-border bg-navy-light px-4 py-3 text-sm text-muted">
          {feedback}
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Campaign Progress</CardTitle>
            <CardDescription className="text-muted">Step completion across assigned leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted">Overall completion</span>
              <span className="text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="mb-6 h-2" />
            <div className="space-y-3">
              {campaign.sequences.map((step, index) => {
                const reached = campaign.campaignLeads.filter((item) => (item.currentStep || 0) >= step.stepOrder).length
                const percent = campaign.campaignLeads.length ? Math.round((reached / campaign.campaignLeads.length) * 100) : 0
                return (
                  <div key={step.id} className="rounded-lg border border-border bg-navy p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-white">Step {index + 1}: {step.name}</p>
                      <span className="text-sm text-muted">{percent}% reached</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                )
              })}
              {campaign.sequences.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
                  Add at least one step before activating this campaign.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Lead Status</CardTitle>
            <CardDescription className="text-muted">First 100 assigned leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 space-y-3 overflow-auto">
              {campaign.campaignLeads.map((item) => (
                <div key={item.lead.id} className="rounded-lg border border-border bg-navy p-3">
                  <p className="text-sm font-medium text-white">{item.lead.firstName} {item.lead.lastName}</p>
                  <p className="text-xs text-muted">{item.lead.title || 'No title'} at {item.lead.company || 'No company'}</p>
                  <p className="mt-2 text-xs text-accent">Step {item.currentStep || 0} • {item.status}</p>
                  {item.nextMessageDate && (
                    <p className="mt-1 text-xs text-muted">Next action {new Date(item.nextMessageDate).toLocaleString()}</p>
                  )}
                  {item.lastMessageSent && (
                    <p className="mt-1 text-xs text-muted">Last sent {new Date(item.lastMessageSent).toLocaleString()}</p>
                  )}
                  {item.lastError && (
                    <p className="mt-2 text-xs text-red-400">{item.lastError}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => changeLeadStatus(item.lead.id, 'accepted')}>
                      Accepted
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => changeLeadStatus(item.lead.id, 'replied')}>
                      Replied
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => changeLeadStatus(item.lead.id, 'failed')}>
                      Failed
                    </Button>
                  </div>
                </div>
              ))}
              {campaign.campaignLeads.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
                  No leads assigned yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Campaign Steps</CardTitle>
            <CardDescription className="text-muted">
              Edit every step before running. Variables such as {'{{firstName}}'}, {'{{company}}'}, {'{{title}}'}, and {'{{industry}}'} auto-fill from each lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveStep} className="mb-6 rounded-lg border border-border bg-navy p-4">
              <div className="mb-4 grid gap-4 md:grid-cols-[1fr_120px]">
                <div className="space-y-2">
                  <Label htmlFor="stepName" className="text-white">Step Name</Label>
                  <Input id="stepName" value={draftStep.name} onChange={(event) => setDraftStep({ ...draftStep, name: event.target.value })} placeholder="Connection request" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waitDays" className="text-white">Wait Days</Label>
                  <Input id="waitDays" type="number" min={0} value={draftStep.waitDays} onChange={(event) => setDraftStep({ ...draftStep, waitDays: Number(event.target.value) })} required />
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <Label htmlFor="actionType" className="text-white">Action Type</Label>
                <select
                  id="actionType"
                  value={draftStep.actionType}
                  onChange={(event) => setDraftStep({ ...draftStep, actionType: event.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="connection_request">Connection request</option>
                  <option value="message">LinkedIn message</option>
                  <option value="profile_visit">Profile visit</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template" className="text-white">Message Template</Label>
                <p className="text-xs text-muted">
                  Keep the variable tags in the template. You do not manually replace them; the campaign fills them from each lead record when messages are generated.
                </p>
                <textarea
                  id="template"
                  value={draftStep.messageTemplate}
                  onChange={(event) => setDraftStep({ ...draftStep, messageTemplate: event.target.value })}
                  className="min-h-32 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {draftStep.id ? 'Save Step' : 'Add Step'}
                </Button>
                {draftStep.id && (
                  <Button type="button" variant="outline" onClick={resetDraft}>Cancel Edit</Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {campaign.sequences.map((step) => (
                <div key={step.id} className="rounded-lg border border-border bg-navy p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">Step {step.stepOrder}: {step.name}</p>
                      <p className="text-sm text-muted">
                        {step.actionType === 'connection_request' ? 'Connection request' : 'LinkedIn message'} • Wait {step.waitDays} day{step.waitDays === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => editStep(step)}>
                        <Edit3 className="h-4 w-4 text-accent" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteStep(step.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap rounded bg-secondary p-3 text-sm text-muted">{step.messageTemplate}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">10 Professional Message Examples</CardTitle>
            <CardDescription className="text-muted">
              Copy or load into the step editor. Placeholder variables are replaced automatically for each lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoMessages.map((message, index) => (
                <div key={message} className="rounded-lg border border-border bg-navy p-3">
                  <p className="mb-3 text-sm text-muted">{index + 1}. {message}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyText(message)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={() => setDraftStep({ ...draftStep, messageTemplate: message })}>
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
