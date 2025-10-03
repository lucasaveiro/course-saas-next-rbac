import { env } from '@saas/env'
import crypto from 'node:crypto'

import type { PaymentProvider, PaymentIntent, PaymentCaptureResult, RefundResult } from './types'

export class PagarmeAdapter implements PaymentProvider {
  name = 'pagarme' as const

  async createPaymentIntent(params: {
    amount: number
    currency: string
    metadata?: Record<string, string>
  }): Promise<PaymentIntent> {
    // Placeholder: simulate Pagar.me intent
    const id = `pagarme_pi_${crypto.randomBytes(8).toString('hex')}`
    return { id, status: 'requires_confirmation' }
  }

  async capturePayment(intentId: string): Promise<PaymentCaptureResult> {
    return { id: intentId, status: 'succeeded' }
  }

  async refund(params: { transactionId: string; amount?: number }): Promise<RefundResult> {
    const id = `pagarme_re_${crypto.randomBytes(8).toString('hex')}`
    return { id, status: 'succeeded' }
  }

  verifyWebhook(params: { signature: string | undefined; rawBody: string }): boolean {
    // Placeholder HMAC check using PAGARME_WEBHOOK_SECRET
    if (!env.PAGARME_WEBHOOK_SECRET) return false
    const hmac = crypto
      .createHmac('sha256', env.PAGARME_WEBHOOK_SECRET)
      .update(params.rawBody)
      .digest('hex')
    return hmac === params.signature
  }
}