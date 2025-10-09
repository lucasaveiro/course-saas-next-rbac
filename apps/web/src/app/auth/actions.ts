'use server'

import { env } from '@saas/env'
import { redirect } from 'next/navigation'

export async function signInWithGithub() {
  const githubSignInURL = new URL('login/oauth/authorize', 'https://github.com')

  const clientId = env.GITHUB_OAUTH_CLIENT_ID
  const redirectUri = env.GITHUB_OAUTH_CLIENT_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error('Missing GitHub OAuth environment variables.')
  }

  githubSignInURL.searchParams.set('client_id', clientId)
  githubSignInURL.searchParams.set('redirect_uri', redirectUri)
  githubSignInURL.searchParams.set('scope', 'user')

  redirect(githubSignInURL.toString())
}
