import { api } from './api-client'

export async function captureOrder({
  storeSlug,
  orderId,
}: {
  storeSlug: string
  orderId: string
}) {
  const result = await api
    .post(`stores/${storeSlug}/payments/capture`, {
      json: { orderId },
    })
    .json<{ status: string; transactionId: string }>()
  return result
}

export async function refundOrder({
  storeSlug,
  orderId,
}: {
  storeSlug: string
  orderId: string
}) {
  const result = await api
    .post(`stores/${storeSlug}/payments/refund`, {
      json: { orderId },
    })
    .json<{ status: string; transactionId: string | null }>()
  return result
}

export async function issueInvoice({
  storeSlug,
  orderId,
}: {
  storeSlug: string
  orderId: string
}) {
  const result = await api
    .post(`stores/${storeSlug}/orders/${orderId}/invoice`)
    .json<{ invoiceNumber: string; status: string }>()
  return result
}

export async function startOrderFulfillment({
  storeSlug,
  orderId,
}: {
  storeSlug: string
  orderId: string
}) {
  const result = await api
    .post(`stores/${storeSlug}/orders/${orderId}/fulfillment`)
    .json<{ fulfillmentId: string; status: string }>()
  return result
}
