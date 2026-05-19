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
  'Hi {{firstName}}, noticed your work at {{company}} around {{industry}}. Curious if improving outbound reply quality is on your radar this quarter?',
  'Hi {{firstName}}, your role as {{title}} caught my eye. We help teams find better-fit prospects before campaigns go live. Worth comparing notes?',
  'Hey {{firstName}}, I saw {{company}} is active in {{industry}}. We built a lightweight way to score leads and personalize LinkedIn outreach. Open to a quick look?',
  'Hi {{firstName}}, quick one: are you currently using ICP scoring before your team starts outbound campaigns?',
  'Hi {{firstName}}, I work with teams trying to reduce generic LinkedIn outreach. Thought this might be relevant for {{company}}.',
  'Hey {{firstName}}, saw your profile and thought there may be overlap with how we help {{industry}} teams improve lead quality. Should I send details?',
  'Hi {{firstName}}, if {{company}} is scaling outbound, I can share a simple workflow for cleaner lead lists and safer campaign sequencing.',
  'Hi {{firstName}}, noticed you lead work around {{title}} priorities. We help turn raw prospects into ranked, personalized outreach lists.',
  'Hey {{firstName}}, are you the right person at {{company}} to ask about LinkedIn outreach and lead quality?',
  'Hi {{firstName}}, I had an idea for improving reply rates from {{industry}} prospects. Happy to send a short example if useful.',
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
      messageTemplate: demoMessages[0],
    })
  }

  const editStep = (step: Sequence) => {
    setDraftStep({
      id: step.id,
      name: step.name,
      waitDays: step.waitDays,
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

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setFeedback('Copied message.')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-80 rounded-lg bg-navy-light animate-pulse" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Card className="bg-navy-light border-border">
          <CardContent className="p-8 text-muted">Campaign not found.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/campaigns" className="text-sm text-accent hover:underline">Back to campaigns</Link>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white">{campaign.name}</h1>
          <p className="mt-1 text-muted">
            {campaign.linkedinAccount?.name || 'No LinkedIn account selected'} • {campaign._count?.campaignLeads || 0} leads • {campaign._count?.messages || 0} messages
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            <CardDescription className="text-muted">Edit every step and message template before running</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="template" className="text-white">Message Template</Label>
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
                      <p className="text-sm text-muted">Wait {step.waitDays} day{step.waitDays === 1 ? '' : 's'}</p>
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
            <CardTitle className="text-white">10 Message Examples</CardTitle>
            <CardDescription className="text-muted">Copy or load into the step editor</CardDescription>
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
