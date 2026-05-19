'use client'

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Profile {
  email: string
  fullName: string
  companyName: string | null
  avatarUrl: string | null
  creditsBalance: number
  subscriptionTier: string
  subscriptionStatus: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ fullName: '', companyName: '', avatarUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data: Profile = await fetch('/api/auth/me').then((res) => res.json())
        setProfile(data)
        setForm({
          fullName: data.fullName || '',
          companyName: data.companyName || '',
          avatarUrl: data.avatarUrl || '',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Profile update failed')
        return
      }

      setProfile(data)
      setMessage('Profile updated')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-muted">Manage your account details</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
            <CardDescription className="text-muted">Update the details shown across the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 rounded bg-navy animate-pulse" />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input id="email" value={profile?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">Full Name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-white">Company</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl" className="text-white">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={form.avatarUrl}
                    onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
                  />
                </div>
                {message && <p className="text-sm text-accent">{message}</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="bg-navy-light border-border">
          <CardHeader>
            <CardTitle className="text-white">Account Snapshot</CardTitle>
            <CardDescription className="text-muted">Current plan and credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <User className="h-8 w-8 text-accent" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Credits</p>
                <p className="text-2xl font-bold text-white">{profile?.creditsBalance ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Plan</p>
                <p className="capitalize text-white">{profile?.subscriptionTier || 'free'}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Status</p>
                <p className="capitalize text-white">{profile?.subscriptionStatus || 'inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
