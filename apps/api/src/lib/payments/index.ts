import { env } from '@saas/env'
import type { PaymentProvider } from './types'
import { StripeAdapter } from './stripe'
import { AdyenAdapter } from './adyen'
import { PagarmeAdapter } from './pagarme'

export function getPaymentProvider(): PaymentProvider {
  const provider = env.PAYMENTS_PROVIDER
  switch (provider) {
    case 'stripe':
      return new StripeAdapter()
    case 'adyen':
      return new AdyenAdapter()
    case 'pagarme':
      return new PagarmeAdapter()
    default:
      // Default to Stripe-like mock behavior
      return new StripeAdapter()
  }
}