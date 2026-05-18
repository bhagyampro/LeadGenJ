import { NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from '@/lib/stripe'

export async function GET() {
  return NextResponse.json({
    plans: SUBSCRIPTION_PLANS,
    creditPacks: CREDIT_PACKS,
  })
}