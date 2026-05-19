'use client'

import { useEffect, useState } from 'react'
import { Key, Plus } from 'lucide-react'
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

interface ApiKey {
  id: string
  name: string
  permissions: Record<string, boolean>
  lastUsed: string | null
  expiresAt: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [createdKey, setCreatedKey] = useState('')

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

    const fetchKeys = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/api-keys`)
        setKeys(await res.json())
      } finally {
        setLoading(false)
      }
    }
    fetchKeys()
  }, [selectedWorkspace])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreatedKey('')

    const res = await fetch(`/api/workspaces/${selectedWorkspace}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions: { read: true, write: false } }),
    })

    if (!res.ok) return

    const data = await res.json()
    setCreatedKey(data.key)
    setKeys([{ ...data, lastUsed: null, expiresAt: null }, ...keys])
    setName('')
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">API Keys</h1>
          <p className="mt-1 text-muted">Create and view workspace developer keys</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-navy-light border-border">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-white">Create API Key</DialogTitle>
                <DialogDescription className="text-muted">
                  The full key is shown once after creation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName" className="text-white">Name</Label>
                  <Input id="keyName" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>
                {createdKey && (
                  <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                    <p className="mb-2 text-sm text-accent">New key</p>
                    <code className="break-all text-sm text-white">{createdKey}</code>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Create Key</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-navy-light border-border">
        <CardHeader>
          <CardTitle className="text-white">Workspace Keys</CardTitle>
          <CardDescription className="text-muted">Keys are stored hashed and cannot be revealed later.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-24 rounded bg-navy animate-pulse" />
          ) : keys.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              <Key className="mx-auto mb-3 h-8 w-8" />
              No API keys yet.
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div key={key.id} className="flex flex-col gap-3 rounded-lg border border-border bg-navy p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{key.name}</p>
                    <p className="text-sm text-muted">Created {new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge>{Object.keys(key.permissions || {}).join(', ') || 'read'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
