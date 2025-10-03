import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3333),
    // Accept Prisma SQLite URLs like "file:./dev.db" as well as standard URLs
    DATABASE_URL: z.string(),

    JWT_SECRET: z.string(),

    GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
    GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string().url().optional(),

    // Payments
    PAYMENTS_PROVIDER: z
      .enum(['stripe', 'adyen', 'pagarme'])
      .optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    ADYEN_API_KEY: z.string().optional(),
    ADYEN_WEBHOOK_HMAC_KEY: z.string().optional(),
    PAGARME_API_KEY: z.string().optional(),
    PAGARME_WEBHOOK_SECRET: z.string().optional(),
  },
  client: {},
  shared: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    PORT: process.env.SERVER_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    GITHUB_OAUTH_CLIENT_REDIRECT_URI:
      process.env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    PAYMENTS_PROVIDER: process.env.PAYMENTS_PROVIDER,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ADYEN_API_KEY: process.env.ADYEN_API_KEY,
    ADYEN_WEBHOOK_HMAC_KEY: process.env.ADYEN_WEBHOOK_HMAC_KEY,
    PAGARME_API_KEY: process.env.PAGARME_API_KEY,
    PAGARME_WEBHOOK_SECRET: process.env.PAGARME_WEBHOOK_SECRET,
  },
  emptyStringAsUndefined: true,
})
