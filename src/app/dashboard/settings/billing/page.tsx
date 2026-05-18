'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditBalanceDisplay } from '@/components/dashboard/credit-balance'
import { Check, CreditCard, ShieldCheck, Users, Zap } from 'lucide-react'

interface SubscriptionPlan {
  name: string
  tier: string
  price: number
  creditsPerMonth: number
  features: string[]
}

interface CreditPack {
  name: string
  credits: number
  price: number
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<{ tier: string; status: string } | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
  const [account, setAccount] = useState<{
    email: string
    fullName: string
    creditsBalance: number
    subscriptionTier: string
    subscriptionStatus: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, plansRes, accountRes] = await Promise.all([
          fetch('/api/subscription/current').then((res) => res.json()),
          fetch('/api/subscription/plans').then((res) => res.json()),
          fetch('/api/auth/me').then((res) => res.json()),
        ])
        setCurrentPlan(subRes)
        setPlans(plansRes.plans || [])
        setCreditPacks(plansRes.creditPacks || [])
        setAccount(accountRes)
      } catch (error) {
        console.error('Error fetching billing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handlePurchase = async (pack: CreditPack) => {
    // In production, this would redirect to Stripe checkout
    alert(`Purchase ${pack.credits} credits for $${pack.price / 100}? (Demo)`)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Billing & Credits</h1>
          <p className="text-muted mt-1">Manage your subscription and credits</p>
        </div>
        <CreditBalanceDisplay />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-navy-light border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted">Credits available</p>
              <p className="text-2xl font-bold text-white">{account?.creditsBalance ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-navy-light border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted">Plan status</p>
              <p className="text-2xl font-bold capitalize text-white">{account?.subscriptionStatus || currentPlan?.status || 'inactive'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-navy-light border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted">Billing user</p>
              <p className="truncate text-lg font-semibold text-white">{account?.email || 'Signed in user'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan */}
      <Card className="bg-navy-light border-border mb-8">
        <CardHeader>
          <CardTitle className="text-white">Current Plan</CardTitle>
          <CardDescription className="text-muted">
            Your current subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-20 bg-navy rounded animate-pulse" />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white capitalize">
                  {currentPlan?.tier || 'Free'}
                </p>
                <p className="text-muted">
                  Status: <span className="text-accent capitalize">{currentPlan?.status || 'inactive'}</span>
                </p>
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <h2 className="text-2xl font-bold text-white font-heading mb-4">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card
            key={plan.tier}
            className={`bg-navy-light border-border ${
              currentPlan?.tier === plan.tier ? 'border-accent' : ''
            }`}
          >
            <CardHeader>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <CardDescription className="text-muted">
                {plan.creditsPerMonth} credits/month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white mb-4">
                ${plan.price / 100}
                <span className="text-lg text-muted font-normal">/mo</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={currentPlan?.tier === plan.tier ? 'outline' : 'default'}
              >
                {currentPlan?.tier === plan.tier ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credit Packs */}
      <h2 className="text-2xl font-bold text-white font-heading mb-4">Buy Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPacks.map((pack) => (
          <Card key={pack.name} className="bg-navy-light border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{pack.credits} Credits</p>
                  <p className="text-muted text-sm">{pack.name}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-4">
                ${pack.price / 100}
              </p>
              <Button className="w-full" onClick={() => handlePurchase(pack)}>
                Purchase
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
