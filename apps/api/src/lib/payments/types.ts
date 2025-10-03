export type PaymentIntent = {
  id: string
  clientSecret?: string
  status: 'requires_confirmation' | 'requires_capture' | 'succeeded' | 'failed'
}

export type PaymentCaptureResult = {
  id: string
  status: 'succeeded' | 'requires_action' | 'failed'
}

export type RefundResult = {
  id: string
  status: 'succeeded' | 'failed'
}

export interface PaymentProvider {
  name: 'stripe' | 'adyen' | 'pagarme'
  createPaymentIntent(params: {
    amount: number
    currency: string
    metadata?: Record<string, string>
  }): Promise<PaymentIntent>
  capturePayment(intentId: string): Promise<PaymentCaptureResult>
  refund(params: { transactionId: string; amount?: number }): Promise<RefundResult>
  verifyWebhook(params: { signature: string | undefined; rawBody: string }): boolean
}