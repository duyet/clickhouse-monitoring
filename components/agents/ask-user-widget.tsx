'use client'

import { CheckIcon, MessageCircleQuestionIcon, StarIcon } from 'lucide-react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AskUserOutput {
  type: 'ask_user'
  question: string
  inputType:
    | 'single_choice'
    | 'multi_choice'
    | 'confirm'
    | 'free_text'
    | 'rating'
  options?: Array<{ label: string; value: string; description?: string }>
  placeholder?: string
  min?: number
  max?: number
  context?: string
  awaiting_response?: boolean
}

interface AskUserWidgetProps {
  readonly output: AskUserOutput
  readonly toolCallId: string
  readonly onSubmit: (toolCallId: string, result: string) => void
  readonly isSubmitted?: boolean
}

export function isAskUserOutput(output: unknown): output is AskUserOutput {
  if (!output || typeof output !== 'object') return false
  const obj = output as Record<string, unknown>
  return obj.type === 'ask_user' && typeof obj.question === 'string'
}

export function AskUserWidget({
  output,
  toolCallId,
  onSubmit,
  isSubmitted = false,
}: AskUserWidgetProps) {
  const [selectedValue, setSelectedValue] = useState<string>('')
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
  const [textValue, setTextValue] = useState('')
  const [ratingValue, setRatingValue] = useState(0)
  const [submitted, setSubmitted] = useState(isSubmitted)

  const handleSubmit = (value: string) => {
    setSubmitted(true)
    onSubmit(toolCallId, value)
  }

  if (submitted) {
    return (
      <div className="my-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckIcon className="h-4 w-4" />
          <span>Response submitted</span>
        </div>
      </div>
    )
  }

  return (
    <div className="my-2 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/20">
      {/* Question header */}
      <div className="flex items-start gap-2 mb-3">
        <MessageCircleQuestionIcon className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          {output.context && (
            <p className="text-xs text-muted-foreground mb-1">
              {output.context}
            </p>
          )}
          <p className="text-sm font-medium">{output.question}</p>
        </div>
      </div>

      {/* Input widget based on type */}
      {output.inputType === 'single_choice' && output.options && (
        <div className="space-y-1.5 mb-3">
          {output.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedValue(opt.value)}
              className={cn(
                'flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                selectedValue === opt.value
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                  selectedValue === opt.value
                    ? 'border-blue-500'
                    : 'border-muted-foreground/40'
                )}
              >
                {selectedValue === opt.value && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div>
                <span className="font-medium">{opt.label}</span>
                {opt.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {opt.description}
                  </p>
                )}
              </div>
            </button>
          ))}
          <Button
            size="sm"
            disabled={!selectedValue}
            onClick={() => handleSubmit(selectedValue)}
            className="mt-2"
          >
            Submit
          </Button>
        </div>
      )}

      {output.inputType === 'multi_choice' && output.options && (
        <div className="space-y-1.5 mb-3">
          {output.options.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex w-full items-start gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors',
                selectedValues.has(opt.value)
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <Checkbox
                checked={selectedValues.has(opt.value)}
                onCheckedChange={(checked) => {
                  const next = new Set(selectedValues)
                  if (checked) {
                    next.add(opt.value)
                  } else {
                    next.delete(opt.value)
                  }
                  setSelectedValues(next)
                }}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium">{opt.label}</span>
                {opt.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {opt.description}
                  </p>
                )}
              </div>
            </label>
          ))}
          <Button
            size="sm"
            disabled={selectedValues.size === 0}
            onClick={() =>
              handleSubmit(JSON.stringify(Array.from(selectedValues)))
            }
            className="mt-2"
          >
            Submit ({selectedValues.size} selected)
          </Button>
        </div>
      )}

      {output.inputType === 'confirm' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleSubmit('yes')}>
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSubmit('no')}
          >
            No
          </Button>
        </div>
      )}

      {output.inputType === 'free_text' && (
        <div className="space-y-2">
          <Input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={output.placeholder || 'Type your response...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textValue.trim()) {
                handleSubmit(textValue.trim())
              }
            }}
          />
          <Button
            size="sm"
            disabled={!textValue.trim()}
            onClick={() => handleSubmit(textValue.trim())}
          >
            Submit
          </Button>
        </div>
      )}

      {output.inputType === 'rating' && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {Array.from(
              { length: (output.max || 5) - (output.min || 1) + 1 },
              (_, i) => i + (output.min || 1)
            ).map((n) => (
              <button
                key={n}
                onClick={() => setRatingValue(n)}
                className={cn(
                  'p-1 transition-colors',
                  ratingValue >= n
                    ? 'text-yellow-500'
                    : 'text-muted-foreground/30 hover:text-yellow-300'
                )}
              >
                <StarIcon
                  className="h-6 w-6"
                  fill={ratingValue >= n ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
          <Button
            size="sm"
            disabled={ratingValue === 0}
            onClick={() => handleSubmit(String(ratingValue))}
          >
            Submit ({ratingValue}/{output.max || 5})
          </Button>
        </div>
      )}
    </div>
  )
}
