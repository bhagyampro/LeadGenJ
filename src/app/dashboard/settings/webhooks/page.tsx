'use client'

import { useEffect, useState } from 'react'
import { Plus, Webhook } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Workspace {
  id: string
  name: string
}

interface WebhookConfig {
  id: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
}

export default function WebhooksPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('lead.created,message.sent')
  const [createdSecret, setCreatedSecret] = useState('')

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch('/api/workspaces')
      const data: Workspace[] = await res.json()
      if (data?.length > 0) setSelectedWorkspace(data[0].id)
    }
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (!selectedWorkspace) return

    const fetchWebhooks = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/webhooks`)
        setWebhooks(await res.json())
      } finally {
        setLoading(false)
      }
    }
    fetchWebhooks()
  }, [selectedWorkspace])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreatedSecret('')

    const res = await fetch(`/api/workspaces/${selectedWorkspace}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        events: events.split(',').map((item) => item.trim()).filter(Boolean),
      }),
    })

    if (!res.ok) return

    const data = await res.json()
    setCreatedSecret(data.secret)
    setWebhooks([{ ...data, secret: undefined }, ...webhooks])
    setUrl('')
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">Webhooks</h1>
          <p className="mt-1 text-muted">Register event destinations for this workspace</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-navy-light border-border">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-white">Create Webhook</DialogTitle>
                <DialogDescription className="text-muted">
                  The signing secret is shown once after creation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl" className="text-white">Endpoint URL</Label>
                  <Input id="webhookUrl" type="url" value={url} onChange={(event) => setUrl(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookEvents" className="text-white">Events</Label>
                  <Input id="webhookEvents" value={events} onChange={(event) => setEvents(event.target.value)} required />
                </div>
                {createdSecret && (
                  <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                    <p className="mb-2 text-sm text-accent">Signing secret</p>
                    <code className="break-all text-sm text-white">{createdSecret}</code>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Create Webhook</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-navy-light border-border">
        <CardHeader>
          <CardTitle className="text-white">Configured Webhooks</CardTitle>
          <CardDescription className="text-muted">Registered endpoints and subscribed events.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-24 rounded bg-navy animate-pulse" />
          ) : webhooks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              <Webhook className="mx-auto mb-3 h-8 w-8" />
              No webhooks yet.
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="rounded-lg border border-border bg-navy p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="truncate font-medium text-white">{webhook.url}</p>
                    <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline">{event}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
