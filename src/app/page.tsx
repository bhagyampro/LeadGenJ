import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart3,
  Bot,
  GitBranch,
  Globe,
  Inbox,
  KanbanSquare,
  MessageSquare,
  Plug,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react"

const targetMarkets = [
  "Agencies",
  "Recruiters",
  "Sales Teams",
  "B2B Companies",
  "Real Estate Companies",
  "Freelancers",
  "Startup Founders",
  "Marketing Agencies",
  "Local Businesses",
  "Consultants",
]

const heroCapabilities = [
  { icon: Target, label: "Lead finder", value: "LinkedIn, Maps, Instagram, websites" },
  { icon: GitBranch, label: "Campaign builder", value: "Templates, cloning, A/B tests, smart delays" },
  { icon: Inbox, label: "Unified inbox", value: "Multi-account sync, labels, notes, assignments" },
  { icon: KanbanSquare, label: "CRM pipeline", value: "Kanban stages, tasks, deals, activity timeline" },
  { icon: Bot, label: "AI assistant", value: "Scoring, replies, content, personalization" },
  { icon: Plug, label: "API and webhooks", value: "Public API, OAuth, Zapier, n8n, Slack, HubSpot" },
]

const automationSignals = [
  "LinkedIn automation",
  "Human-like delays",
  "Proxy rotation",
  "White-label",
  "MCP server",
  "Team permissions",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-light">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-navy" />
            </div>
            <span className="text-xl font-bold text-slate-950 font-heading">LeadgenJ</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-950 transition-colors">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-950 transition-colors">Pricing</a>
            <Link href="/login">
              <Button variant="ghost" className="text-slate-950">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_0.92fr] gap-12 items-center">
          <div className="hero-preview-enter">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-7 shadow-sm">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-accent text-sm font-medium">
                AI-powered multi-channel lead generation and outreach automation SaaS
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-950 font-heading mb-6 leading-tight">
              AI Sales Automation Platform
              <span className="gradient-text block">for scalable outreach</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mb-8">
              Build Apollo-style lead generation, SendPilot-style campaigns, Dripify
              and HeyReach-style LinkedIn automation, Expandi-style follow-ups,
              PhantomBuster-style scraping, CRM pipelines, unified inboxes, team
              workspaces, and API-first workflows in one modern SaaS platform.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/register">
                <Button size="lg" className="px-8 h-14 text-lg glow-accent">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
                  View Demo
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 max-w-3xl">
              {targetMarkets.map((market) => (
                <span
                  key={market}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm hero-stagger-1"
                >
                  {market}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-2xl">
              <div className="hero-stagger-1">
                <p className="text-3xl font-bold text-slate-950">24/7</p>
                <p className="text-sm text-slate-500">automation workers</p>
              </div>
              <div className="hero-stagger-2">
                <p className="text-3xl font-bold text-slate-950">20+</p>
                <p className="text-sm text-slate-500">data and app integrations</p>
              </div>
              <div className="hero-stagger-3">
                <p className="text-2xl font-bold text-slate-950 sm:text-3xl">Unlimited</p>
                <p className="text-sm text-slate-500">campaigns and sequences</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-[2rem] bg-accent/10 blur-3xl hero-frame-pulse" />
            <div className="absolute -left-8 top-10 h-40 w-44 rounded-2xl border border-accent/20 bg-accent/10 hero-frame" />
            <div className="absolute -right-6 bottom-12 h-48 w-40 rounded-2xl border border-indigo-200 bg-indigo-50 hero-frame-slow" />
            <div className="absolute left-24 -top-5 h-20 w-56 rounded-2xl border border-slate-200 bg-white/70 shadow-xl hero-frame-slow" />
            <div className="relative rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-200/70 hero-preview-enter">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm text-slate-500">Workspace command center</p>
                  <h2 className="text-xl font-semibold text-slate-950">Outbound OS</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                  <Shield className="h-4 w-4" />
                  healthy
                </div>
              </div>

              <div className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3 hero-stagger-1">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4 text-accent" />
                    Accounts
                  </div>
                  <p className="text-2xl font-bold text-slate-950">42</p>
                  <p className="text-xs text-slate-500">LinkedIn seats synced</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 hero-stagger-2">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    Reply rate
                  </div>
                  <p className="text-2xl font-bold text-slate-950">18.6%</p>
                  <p className="text-xs text-slate-500">AI-optimized sequence</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 hero-stagger-3">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <Globe className="h-4 w-4 text-accent" />
                    Sources
                  </div>
                  <p className="text-2xl font-bold text-slate-950">6</p>
                  <p className="text-xs text-slate-500">scrapers and imports</p>
                </div>
              </div>

              <div className="grid gap-3 py-4 sm:grid-cols-2">
                {heroCapabilities.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hero-stagger-1">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <p className="font-semibold text-slate-950">{label}</p>
                    <p className="mt-1 text-sm text-slate-500">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 hero-stagger-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Live campaign</p>
                    <p className="font-semibold text-slate-950">Agency founder sequence</p>
                  </div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                    Running
                  </span>
                </div>
                <div className="space-y-3">
                  {["Scrape verified leads", "Generate AI opener", "Branch on reply", "Sync CRM and webhooks"].map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-secondary/20 text-sm font-semibold text-accent-secondary">
                        {index + 1}
                      </div>
                      <div className="h-2 flex-1 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${92 - index * 16}%` }} />
                      </div>
                      <span className="w-36 text-sm text-slate-500">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {automationSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-sm hero-stagger-3"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 font-heading mb-4">
              Everything You Need to Scale Outreach
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Powerful features designed to help you generate more leads, close more deals, and grow your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-slate-200 p-6 shadow-sm hero-stagger-1">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 mb-2">AI Message Generation</h3>
                <p className="text-slate-600">
                  Generate personalized messages in seconds using GPT-4. Get 3 variations to choose from.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 p-6 shadow-sm hero-stagger-2">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-accent-secondary/20 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-accent-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 mb-2">ICP Scoring</h3>
                <p className="text-slate-600">
                  Score your leads from 0-100 based on title, company, industry, and location fit.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 p-6 shadow-sm hero-stagger-3">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 mb-2">Campaign Management</h3>
                <p className="text-slate-600">
                  Create multi-step sequences with delays. Auto-stop when leads respond.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 p-6 shadow-sm hero-stagger-1">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 mb-2">Analytics Dashboard</h3>
                <p className="text-slate-600">
                  Track reply rates, conversion funnels, and credit usage in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 p-6 shadow-sm hero-stagger-2">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 mb-2">Unified Inbox</h3>
                <p className="text-slate-600">
                  All your LinkedIn conversations in one place. Never miss a reply.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 p-6 shadow-sm hero-stagger-3">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950 mb-2">Safety Features</h3>
                <p className="text-slate-600">
                  Daily limits, warmup mode, and random delays to keep your accounts safe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 font-heading mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 text-lg">
              Start free, upgrade when you&apos;re ready to scale
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white border-slate-200 p-8 shadow-sm">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-slate-950 mb-2">Free</h3>
                <div className="text-4xl font-bold text-slate-950 mb-4">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> 50 credits/month
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> 1 workspace
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> 3 campaigns
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full" variant="outline">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-accent p-8 relative shadow-xl shadow-accent/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-navy font-semibold rounded-full text-sm">
                Most Popular
              </div>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-slate-950 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-slate-950 mb-4">$49<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> 500 credits/month
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> Unlimited workspaces
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> Unlimited campaigns
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> AI features
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full glow-accent">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 p-8 shadow-sm">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-slate-950 mb-2">Business</h3>
                <div className="text-4xl font-bold text-slate-950 mb-4">$149<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> 2000 credits/month
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> Everything in Pro
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> API access
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Zap className="w-4 h-4 text-accent" /> Webhooks
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-navy" />
            </div>
            <span className="text-lg font-bold text-slate-950">LeadgenJ</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} LeadgenJ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
