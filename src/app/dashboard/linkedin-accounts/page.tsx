'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react'

interface LinkedInAccount {
  id: string
  name: string
  profileUrl: string | null
  status: string
  isActive: boolean
  dailyLimit: number
  messagesSentToday: number
  warmupProgress: number
  createdAt: string
}

interface Workspace {
  id: string
  name: string
}

export default function LinkedInAccountsPage() {
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    name: '',
    profileUrl: '',
    sessionCookie: '',
    dailyLimit: 100,
  })
  const [editingAccount, setEditingAccount] = useState({
    id: '',
    name: '',
    profileUrl: '',
    sessionCookie: '',
    dailyLimit: 100,
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
    const result = new URLSearchParams(window.location.search).get('linkedin')
    const messages: Record<string, string> = {
      connected: 'LinkedIn connected successfully.',
      denied: 'LinkedIn authorization was cancelled.',
      failed: 'LinkedIn connection failed. Check the app credentials and redirect URL.',
      invalid_state: 'LinkedIn connection expired. Please try again.',
      missing_config: 'LinkedIn OAuth is missing environment variables.',
      no_workspace: 'Create or select a workspace before connecting LinkedIn.',
    }

    if (result && messages[result]) {
      window.setTimeout(() => setFeedback(messages[result]), 0)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (!selectedWorkspace) return

    const fetchAccounts = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/linkedin-accounts`)
        const data = await res.json()
        setAccounts(data || [])
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [selectedWorkspace])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/linkedin-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      })

      if (res.ok) {
        const account = await res.json()
        setAccounts([account, ...accounts])
        setIsAddOpen(false)
        setNewAccount({ name: '', profileUrl: '', sessionCookie: '', dailyLimit: 100 })
        setFeedback('LinkedIn account saved. Add or update the credential, then validate it.')
      } else {
        const data = await res.json()
        setFeedback(data.error || 'Unable to add LinkedIn account.')
      }
    } catch (error) {
      console.error('Error adding account:', error)
      setFeedback('Unable to add LinkedIn account.')
    }
  }

  const openEditAccount = (account: LinkedInAccount) => {
    setFeedback(null)
    setEditingAccount({
      id: account.id,
      name: account.name,
      profileUrl: account.profileUrl || '',
      sessionCookie: '',
      dailyLimit: account.dailyLimit,
    })
    setIsEditOpen(true)
  }

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    try {
      const res = await fetch(`/api/linkedin-accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAccount.name,
          profileUrl: editingAccount.profileUrl,
          sessionCookie: editingAccount.sessionCookie,
          dailyLimit: editingAccount.dailyLimit,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setAccounts(accounts.map((a) => (a.id === editingAccount.id ? data : a)))
        setIsEditOpen(false)
        setFeedback('Account updated. Click Validate to confirm the connection.')
      } else {
        setFeedback(data.error || 'Unable to update LinkedIn account.')
      }
    } catch (error) {
      console.error('Error updating account:', error)
      setFeedback('Unable to update LinkedIn account.')
    }
  }

  const handleValidate = async (accountId: string) => {
    setValidatingId(accountId)
    setFeedback(null)
    try {
      const res = await fetch(`/api/linkedin-accounts/${accountId}/validate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setAccounts(accounts.map((a) => (a.id === accountId ? { ...a, status: data.valid ? 'active' : 'needs_reconnect' } : a)))
        setFeedback(data.message || 'Account validated successfully.')
      } else {
        setAccounts(accounts.map((a) => (a.id === accountId ? { ...a, status: 'needs_reconnect' } : a)))
        setFeedback(data.message || data.error || 'Reconnect required before this account can send campaign actions.')
      }
    } catch (error) {
      console.error('Error validating account:', error)
      setFeedback('Unable to validate account.')
    } finally {
      setValidatingId(null)
    }
  }

  const handleToggleActive = async (accountId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/linkedin-accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (res.ok) {
        setAccounts(accounts.map((a) => (a.id === accountId ? { ...a, isActive } : a)))
      }
    } catch (error) {
      console.error('Error toggling account:', error)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Delete this LinkedIn account? Campaigns using it will need another account before activation.')) return

    const res = await fetch(`/api/linkedin-accounts/${accountId}`, { method: 'DELETE' })
    if (res.ok) {
      setAccounts(accounts.filter((account) => account.id !== accountId))
      setFeedback('LinkedIn account deleted.')
    } else {
      const data = await res.json()
      setFeedback(data.error || 'Unable to delete LinkedIn account.')
    }
  }

  const handleConnectLinkedIn = () => {
    if (!selectedWorkspace) {
      setFeedback('Create or select a workspace before connecting LinkedIn.')
      return
    }

    window.location.href = `/api/linkedin/connect?workspaceId=${selectedWorkspace}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'invalid':
      case 'needs_reconnect':
        return 'bg-red-500'
      case 'warming_up':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">LinkedIn Accounts</h1>
          <p className="text-muted mt-1">Connect and manage user-approved LinkedIn sending accounts</p>
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
          <Button onClick={handleConnectLinkedIn} disabled={!selectedWorkspace}>
            Connect LinkedIn
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-light border-border">
              <form onSubmit={handleAddAccount}>
                <DialogHeader>
                  <DialogTitle className="text-white">Add LinkedIn Account</DialogTitle>
                  <DialogDescription className="text-muted">
                    Store a user-approved account credential for queue-based sending.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Display Name</Label>
                    <Input
                      id="name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      placeholder="My LinkedIn Account"
                      className="bg-navy border-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileUrl" className="text-white">Profile URL (Optional)</Label>
                    <Input
                      id="profileUrl"
                      value={newAccount.profileUrl}
                      onChange={(e) => setNewAccount({ ...newAccount, profileUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="bg-navy border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionCookie" className="text-white">Account Credential</Label>
                    <Input
                      id="sessionCookie"
                      value={newAccount.sessionCookie}
                      onChange={(e) => setNewAccount({ ...newAccount, sessionCookie: e.target.value })}
                      placeholder="Encrypted credential or integration token"
                      className="bg-navy border-border"
                    />
                    <p className="text-xs text-muted">
                      Use only credentials you are authorized to store. Official integration tokens are preferred.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit" className="text-white">Daily Message Limit</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={newAccount.dailyLimit}
                      onChange={(e) => setNewAccount({ ...newAccount, dailyLimit: parseInt(e.target.value) })}
                      className="bg-navy border-border"
                      min={1}
                      max={200}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-border bg-navy-light px-4 py-3 text-sm text-muted">
          {feedback}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-navy-light border-border">
          <form onSubmit={handleEditAccount}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit LinkedIn Account</DialogTitle>
              <DialogDescription className="text-muted">
                Update the saved account details or paste a new authorized credential, then validate again.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-white">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="bg-navy border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-profileUrl" className="text-white">Profile URL</Label>
                <Input
                  id="edit-profileUrl"
                  value={editingAccount.profileUrl}
                  onChange={(e) => setEditingAccount({ ...editingAccount, profileUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="bg-navy border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sessionCookie" className="text-white">New Account Credential</Label>
                <Input
                  id="edit-sessionCookie"
                  value={editingAccount.sessionCookie}
                  onChange={(e) => setEditingAccount({ ...editingAccount, sessionCookie: e.target.value })}
                  placeholder="Paste new authorized credential or integration token"
                  className="bg-navy border-border"
                />
                <p className="text-xs text-muted">
                  Leave blank to keep the existing credential.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dailyLimit" className="text-white">Daily Message Limit</Label>
                <Input
                  id="edit-dailyLimit"
                  type="number"
                  value={editingAccount.dailyLimit}
                  onChange={(e) => setEditingAccount({ ...editingAccount, dailyLimit: parseInt(e.target.value) })}
                  className="bg-navy border-border"
                  min={1}
                  max={200}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-navy-light border-border">
              <CardContent className="p-6">
                <div className="h-6 w-32 bg-navy rounded animate-pulse mb-4" />
                <div className="h-4 w-24 bg-navy rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : accounts.length === 0 ? (
          <Card className="bg-navy-light border-border col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-muted mb-4">No LinkedIn accounts yet. Add your first account to prepare campaign sending.</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className="bg-navy-light border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white text-lg">{account.name}</CardTitle>
                  <Badge className={`${getStatusColor(account.status)} text-white`}>
                    {account.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Daily Limit</span>
                    <span className="text-white">
                      {account.messagesSentToday} / {account.dailyLimit}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Warmup Progress</span>
                      <span className="text-white">{account.warmupProgress}%</span>
                    </div>
                    <Progress value={account.warmupProgress} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditAccount(account)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={account.isActive ? 'outline' : 'default'}
                      onClick={() => handleToggleActive(account.id, !account.isActive)}
                    >
                      {account.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidate(account.id)}
                      disabled={validatingId === account.id}
                    >
                      {validatingId === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Validate'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
