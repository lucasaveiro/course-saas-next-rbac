import { redirect } from 'next/navigation'

import { ability } from '@/auth/auth'

import { StoreForm } from './store-form'

export default async function CreateStore() {
  const permissions = await ability()

  if (permissions?.cannot('create', 'Store')) {
    redirect('/')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create store</h1>

      <StoreForm />
    </div>
  )
}
