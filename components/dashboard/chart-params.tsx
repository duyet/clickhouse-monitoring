'use client'

import { UpdateIcon } from '@radix-ui/react-icons'
import * as z from 'zod'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ShakeFormControl } from '@/components/forms/shake-form-control'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { updateSettingParams } from '@/lib/api/dashboard-api-client'
import { ErrorLogger } from '@/lib/logger'

interface ChartParamsProps {
  params: Record<string, string>
}

interface ChartParamsFormProps extends ChartParamsProps {
  onRefresh: () => void
}

export const formSchema = z.record(z.string(), z.string())

export type FormSchema = z.infer<typeof formSchema>

/**
 * Renders editable chart query parameters and submits updates.
 *
 * @param params - Current chart parameter values.
 * @param onRefresh - Callback invoked after a successful update.
 * @returns Chart parameter form.
 */
export const ChartParamsForm = ({
  params,
  onRefresh,
}: ChartParamsFormProps) => {
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...params,
    },
  })

  async function onSubmit(values: FormSchema) {
    try {
      setError(null)
      const resp = await updateSettingParams(values)
      ErrorLogger.logDebug('Chart params updated', { response: resp })
      onRefresh()
    } catch (e) {
      ErrorLogger.logError(e as Error, {
        component: 'ChartParams',
        action: 'submit',
      })
      setError('Error updating params')
    }
  }

  return (
    <Form {...form}>
      <form
        className="mb-4 flex flex-col sm:flex-row items-end gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {Object.keys(params).map((key: string) => (
          <FormField
            control={form.control}
            name={key}
            key={key}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{key}</FormLabel>
                <ShakeFormControl>
                  <Input {...field} />
                </ShakeFormControl>
              </FormItem>
            )}
          />
        ))}
        <Button
          type="submit"
          variant={!error ? 'outline' : 'destructive'}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <span className="flex-rows flex gap-2">
              <UpdateIcon className="mr-2 size-3 animate-spin" />
              Updating...
            </span>
          ) : (
            'Update'
          )}
          {error && ' (error)'}
        </Button>
      </form>
    </Form>
  )
}

/**
 * Connects chart parameter updates to the Next.js router refresh flow.
 *
 * @param params - Current chart parameter values.
 * @returns Chart parameter form wired to refresh route data.
 */
export const ChartParams = ({ params }: ChartParamsProps) => {
  const router = useRouter()

  return <ChartParamsForm params={params} onRefresh={() => router.refresh()} />
}
