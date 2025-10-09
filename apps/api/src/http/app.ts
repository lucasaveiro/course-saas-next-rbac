import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import { env } from '@saas/env'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandler } from '@/http/error-handler'
import { authenticateWithGithub } from '@/http/routes/auth/authenticate-with-github'
import { authenticateWithPassword } from '@/http/routes/auth/authenticate-with-password'
import { getProfile } from '@/http/routes/auth/get-profile'
import { requestPasswordRecover } from '@/http/routes/auth/request-password-recover'
import { resetPassword } from '@/http/routes/auth/reset-password'
import { getOrganizationBilling } from '@/http/routes/billing/get-organization-billing'
import { storefrontCart } from '@/http/routes/cart/storefront-cart'
import { getStorefrontProducts } from '@/http/routes/storefront/get-store-products'
import { createProduct } from '@/http/routes/catalog/create-product'
import { deleteProduct } from '@/http/routes/catalog/delete-product'
import { getProducts } from '@/http/routes/catalog/get-products'
import { updateProduct } from '@/http/routes/catalog/update-product'
import { updateProductAttributes } from '@/http/routes/catalog/update-product-attributes'
import { updateProductPrice } from '@/http/routes/catalog/update-product-price'
import { completeCheckout } from '@/http/routes/checkout/complete-checkout'
import { createCheckoutSession } from '@/http/routes/checkout/create-checkout-session'
import { authenticateCustomer } from '@/http/routes/customers/authenticate-customer'
import { getCustomers } from '@/http/routes/customers/get-customers'
import { refreshCustomerSession } from '@/http/routes/customers/refresh-customer-session'
import { registerCustomerAccount } from '@/http/routes/customers/register-customer-account'
import { acceptInvite } from '@/http/routes/invites/accept-invite'
import { createInvite } from '@/http/routes/invites/create-invite'
import { getInvite } from '@/http/routes/invites/get-invite'
import { getPendingInvites } from '@/http/routes/invites/get-pending-invites'
import { rejectInvite } from '@/http/routes/invites/reject-invite'
import { revokeInvite } from '@/http/routes/invites/revoke-invite'
import { getMembers } from '@/http/routes/members/get-members'
import { removeMember } from '@/http/routes/members/remove-member'
import { updateMember } from '@/http/routes/members/update-member'
import { getOrders } from '@/http/routes/orders/get-orders'
import { invoiceOrder } from '@/http/routes/orders/invoice-order'
import { ordersSSE } from '@/http/routes/orders/orders-sse'
import { startFulfillment } from '@/http/routes/orders/start-fulfillment'
import { createOrganization } from '@/http/routes/orgs/create-organization'
import { getMembership } from '@/http/routes/orgs/get-membership'
import { getOrganization } from '@/http/routes/orgs/get-organization'
import { getOrganizations } from '@/http/routes/orgs/get-organizations'
import { shutdownOrganization } from '@/http/routes/orgs/shutdown-organization'
import { transferOrganization } from '@/http/routes/orgs/transfer-organization'
import { updateOrganization } from '@/http/routes/orgs/update-organization'
import { adyenWebhook } from '@/http/routes/payments/adyen-webhook'
import { captureOrderPayment } from '@/http/routes/payments/capture-order'
import { pagarmeWebhook } from '@/http/routes/payments/pagarme-webhook'
import { refundOrder } from '@/http/routes/payments/refund-order'
import { stripeWebhook } from '@/http/routes/payments/stripe-webhook'
import { createStore } from '@/http/routes/stores/create-store'
import { deleteStore } from '@/http/routes/stores/delete-store'
import { getStore } from '@/http/routes/stores/get-store'
import { getStores } from '@/http/routes/stores/get-stores'
import { updateStore } from '@/http/routes/stores/update-store'

import { createAccount } from './routes/auth/create-account'
import { getInvites } from './routes/invites/get-invites'

export function buildApp() {
  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setSerializerCompiler(serializerCompiler)
  app.setValidatorCompiler(validatorCompiler)

  app.setErrorHandler(errorHandler)

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Next.js SaaS',
        description: 'Full-stack SaaS with multi-tenant & RBAC.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
  })

  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  app.register(fastifyCors)

  app.register(createAccount)
  app.register(authenticateWithPassword)
  app.register(authenticateWithGithub)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)

  app.register(createOrganization)
  app.register(getMembership)
  app.register(getOrganization)
  app.register(getOrganizations)
  app.register(updateOrganization)
  app.register(shutdownOrganization)
  app.register(transferOrganization)

  app.register(createStore)
  app.register(deleteStore)
  app.register(getStore)
  app.register(getStores)
  app.register(updateStore)

  app.register(getProducts)
  app.register(createProduct)
  app.register(updateProduct)
  app.register(updateProductAttributes)
  app.register(updateProductPrice)
  app.register(deleteProduct)

  app.register(getCustomers)
  app.register(registerCustomerAccount)
  app.register(authenticateCustomer)
  app.register(refreshCustomerSession)
  app.register(getOrders)
  app.register(storefrontCart)
  app.register(getStorefrontProducts)
  app.register(createCheckoutSession)
  app.register(completeCheckout)
  app.register(stripeWebhook)
  app.register(adyenWebhook)
  app.register(pagarmeWebhook)
  app.register(refundOrder)
  app.register(captureOrderPayment)
  app.register(invoiceOrder)
  app.register(startFulfillment)
  app.register(ordersSSE)

  app.register(getMembers)
  app.register(updateMember)
  app.register(removeMember)

  app.register(createInvite)
  app.register(getInvite)
  app.register(getInvites)
  app.register(acceptInvite)
  app.register(rejectInvite)
  app.register(revokeInvite)
  app.register(getPendingInvites)

  app.register(getOrganizationBilling)

  return app
}
