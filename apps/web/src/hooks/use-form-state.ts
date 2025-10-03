import { FormEvent, useState, useTransition } from 'react'
import { requestFormReset } from 'react-dom'

interface FormState {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null
}

export function useFormState(
  action: (data: FormData) => Promise<FormState>,
  onSuccess?: () => Promise<void> | void,
  initialState?: FormState,
) {
  const [isPending, startTransition] = useTransition()

  const [formState, setFormState] = useState(
    initialState ?? { success: false, message: null, errors: null },
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    // Call requestFormReset synchronously inside the transition to satisfy React 19.
    // Then resolve the action promise and update state.
    startTransition(() => {
      try {
        requestFormReset(form)
      } catch (e) {
        console.error(e)
      }

      action(data)
        .then(async (state) => {
          if (state.success && onSuccess) {
            await onSuccess()
          }

          setFormState(state)
        })
        .catch((err) => {
          console.error(err)
        })
    })
  }

  return [formState, handleSubmit, isPending] as const
}
