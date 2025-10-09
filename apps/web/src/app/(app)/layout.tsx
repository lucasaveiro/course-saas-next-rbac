import { auth } from '@/auth/auth'

export default async function AppLayout({
  children,
  sheet,
}: Readonly<{
  children: React.ReactNode
  sheet: React.ReactNode
}>) {
  // Ensure token is valid; redirects to sign-in or sign-out on failure
  await auth()

  return (
    <>
      {children}
      {sheet}
    </>
  )
}
