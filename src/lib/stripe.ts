import Stripe from 'stripe'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required for billing features')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export const CREDIT_PACKS = [
  { name: 'Starter', credits: 100, price: 1000, priceId: 'price_starter_100' },
  { name: 'Growth', credits: 500, price: 4000, priceId: 'price_growth_500' },
  { name: 'Scale', credits: 2000, price: 15000, priceId: 'price_scale_2000' },
]

export const SUBSCRIPTION_PLANS = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    creditsPerMonth: 50,
    features: ['50 credits/month', '1 workspace', '3 campaigns', 'Email support'],
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 4900,
    creditsPerMonth: 500,
    priceId: 'price_pro_monthly',
    features: ['500 credits/month', 'Unlimited workspaces', 'Unlimited campaigns', 'Priority support', 'AI features'],
  },
  {
    name: 'Business',
    tier: 'business',
    price: 14900,
    creditsPerMonth: 2000,
    priceId: 'price_business_monthly',
    features: ['2000 credits/month', 'Unlimited workspaces', 'Unlimited campaigns', 'Priority support', 'AI features', 'API access', 'Webhooks'],
  },
]

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return getStripeClient().checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

export async function createSubscriptionSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return getStripeClient().checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

export async function getOrCreateCustomer(email: string, name: string) {
  const stripe = getStripeClient()
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  return stripe.customers.create({
    email,
    name,
  })
}
