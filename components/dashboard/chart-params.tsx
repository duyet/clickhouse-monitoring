'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { ErrorLogger } from '@/lib/error-logger'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { updateSettingParams } from '@/lib/api/dashboard-api-client'

interface ChartParamsProps {
  params: Record<string, string>
}

export const formSchema = z.record(z.string(), z.string())

export type FormSchema = z.infer<typeof formSchema>

export const ChartParams = ({ params }: ChartParamsProps) => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...params,
    },
  })

  async function onSubmit(values: FormSchema) {
    try {
      const resp = await updateSettingParams(values)
      ErrorLogger.logDebug('Chart params updated', { response: resp })
      router.refresh()
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
        className="mb-4 flex flex-row items-end gap-4"
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
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" variant={!error ? 'outline' : 'destructive'}>
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
