'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MessageSquare,
  Users,
  Target,
  BarChart3,
  Settings,
  CreditCard,
  Link2,
  LayoutDashboard,
  Search,
  Key,
  Webhook,
  UserPlus,
  Compass,
  Menu,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Lead Finder', href: '/dashboard/lead-finder', icon: Compass },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Target },
  { name: 'Unibox', href: '/dashboard/unibox', icon: MessageSquare },
  { name: 'LinkedIn', href: '/dashboard/linkedin-accounts', icon: Link2 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Team', href: '/dashboard/team', icon: UserPlus },
]

const settingsNav = [
  { name: 'Profile', href: '/dashboard/settings/profile', icon: Settings },
  { name: 'Billing', href: '/dashboard/settings/billing', icon: CreditCard },
  { name: 'API Keys', href: '/dashboard/settings/api-keys', icon: Key },
  { name: 'Webhooks', href: '/dashboard/settings/webhooks', icon: Webhook },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-navy">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-navy-light px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <MessageSquare className="h-5 w-5 text-navy" />
          </div>
          <span className="font-heading text-lg font-bold text-white">LeadgenJ</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-lg border border-border p-2 text-muted hover:text-white"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-50 border-b border-border bg-navy-light p-3 shadow-xl lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {[...navigation, ...settingsNav].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-secondary hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      <div className="flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen bg-navy-light border-r border-border transition-all duration-300 lg:block",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-navy" />
              </div>
              {sidebarOpen && <span className="text-lg font-bold text-white font-heading">LeadgenJ</span>}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted hover:text-white"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-secondary transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Settings */}
          <div className="p-2 border-t border-border">
            <div className={cn("text-xs text-muted uppercase mb-2", sidebarOpen ? "px-3" : "hidden")}>
              Settings
            </div>
            {settingsNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-secondary transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          {/* User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user?.image || ''} />
                <AvatarFallback className="bg-accent text-navy text-sm">
                  {session.user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                  <p className="text-xs text-muted truncate">{session.user?.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "min-w-0 flex-1 pb-20 transition-all duration-300 lg:pb-0",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        {children}
      </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-navy-light lg:hidden">
        {navigation.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-muted hover:text-white"
          >
            <item.icon className="h-5 w-5" />
            <span className="max-w-full truncate">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
