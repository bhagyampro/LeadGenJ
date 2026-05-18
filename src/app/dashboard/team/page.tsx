'use client'

import { useEffect, useState } from 'react'
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
import { Users, UserPlus } from 'lucide-react'

interface Workspace {
  id: string
  name: string
}

interface Member {
  workspaceId: string
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl: string | null
  }
}

export default function TeamPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      setWorkspaces(data || [])
      if (data?.length > 0) setSelectedWorkspace(data[0].id)
    }
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (!selectedWorkspace) return

    const fetchMembers = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/members`)
        if (!res.ok) throw new Error('Unable to load members')
        setMembers(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [selectedWorkspace])

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const res = await fetch(`/api/workspaces/${selectedWorkspace}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Unable to add member')
      return
    }

    setMembers([data, ...members])
    setEmail('')
    setRole('member')
    setIsOpen(false)
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">Team Management</h1>
          <p className="mt-1 text-muted">Manage workspace users, roles, and access</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWorkspace}
            onChange={(event) => setSelectedWorkspace(event.target.value)}
            className="rounded-lg border border-border bg-navy-light px-3 py-2 text-white"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-navy-light">
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle className="text-white">Add Workspace User</DialogTitle>
                  <DialogDescription className="text-muted">
                    Add an existing registered user to this workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white">Role</Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit">Add User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border bg-navy-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-accent" />
            Workspace Users
          </CardTitle>
          <CardDescription className="text-muted">Users can share inboxes, campaigns, leads, and analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-28 animate-pulse rounded-lg bg-navy" />
          ) : members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              No members found for this workspace.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={`${member.workspaceId}-${member.userId}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-navy p-4"
                >
                  <div>
                    <p className="font-medium text-white">{member.user.fullName}</p>
                    <p className="text-sm text-muted">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{member.role}</Badge>
                    <span className="text-xs text-muted">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
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
