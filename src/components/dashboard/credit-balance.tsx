'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function CreditBalanceDisplay() {
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits/balance')
        const data = await res.json()
        setCredits(data.creditsBalance || 0)
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [])

  if (loading) {
    return (
      <div className="h-10 w-32 bg-navy-light rounded-lg animate-pulse" />
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-navy-light border border-border">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <Wallet className="w-4 h-4 text-accent" />
      </div>
      <div>
        <p className="text-xs text-muted">Credits</p>
        <p className="text-white font-semibold">{credits.toLocaleString()}</p>
      </div>
      <Button size="sm" variant="ghost" className="ml-2 text-accent">
        Buy
      </Button>
    </div>
  )
}