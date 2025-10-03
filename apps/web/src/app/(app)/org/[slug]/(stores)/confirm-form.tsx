'use client'

import { ComponentProps } from 'react'

interface ConfirmFormProps extends ComponentProps<'form'> {
  action: (formData: FormData) => Promise<unknown> | unknown
  confirmMessage?: string
}

export function ConfirmForm({
  action,
  confirmMessage = 'Are you sure you want to delete this store?',
  ...props
}: ConfirmFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const ok = window.confirm(confirmMessage)

    if (!ok) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return <form action={action} onSubmit={handleSubmit} {...props} />
}
