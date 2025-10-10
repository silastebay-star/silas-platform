/**
 * Stripe Payment Intent API Route
 * Creates payment intents for community fund contributions
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseClient } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'gbp', description, metadata } = await request.json()

    // Validate amount
    if (!amount || amount < 50) { // Minimum £0.50
      return NextResponse.json(
        { error: 'Amount must be at least £0.50' },
        { status: 400 }
      )
    }

    // Get user from Supabase auth
    const supabase = createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || 'SILAS Community Fund Contribution',
      metadata: {
        user_id: user.id,
        type: 'community_fund_contribution',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
