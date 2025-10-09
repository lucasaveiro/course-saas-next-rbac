import { env } from '@saas/env'
import { buildApp } from './app'

const app = buildApp()

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`HTTP server running on port ${env.PORT}!`)
})
