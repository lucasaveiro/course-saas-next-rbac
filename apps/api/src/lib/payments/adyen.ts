import { env } from '@saas/env'
import crypto from 'node:crypto'

import type { PaymentProvider, PaymentIntent, PaymentCaptureResult, RefundResult } from './types'

export class AdyenAdapter implements PaymentProvider {
  name = 'adyen' as const

  async createPaymentIntent(params: {
    amount: number
    currency: string
    metadata?: Record<string, string>
  }): Promise<PaymentIntent> {
    // Placeholder: simulate Adyen payment lifecycle
    const id = `adyen_pi_${crypto.randomBytes(8).toString('hex')}`
    return { id, status: 'requires_capture' }
  }

  async capturePayment(intentId: string): Promise<PaymentCaptureResult> {
    return { id: intentId, status: 'succeeded' }
  }

  async refund(params: { transactionId: string; amount?: number }): Promise<RefundResult> {
    const id = `adyen_re_${crypto.randomBytes(8).toString('hex')}`
    return { id, status: 'succeeded' }
  }

  verifyWebhook(params: { signature: string | undefined; rawBody: string }): boolean {
    // Placeholder HMAC check using ADYEN_WEBHOOK_HMAC_KEY
    if (!env.ADYEN_WEBHOOK_HMAC_KEY) return false
    const hmac = crypto
      .createHmac('sha256', env.ADYEN_WEBHOOK_HMAC_KEY)
      .update(params.rawBody)
      .digest('hex')
    return hmac === params.signature
  }
}