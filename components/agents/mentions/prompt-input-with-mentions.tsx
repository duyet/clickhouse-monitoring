'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'
import type { AutocompleteItem } from './types'

import { AutocompletePopover } from './autocomplete-popover'
import { getCaretCoordinates } from './caret-position'
import { MentionBadge, SlashCommandBadge } from './mention-badge'
import { resolveMentionContext } from './resolve-mentions'
import { useAutocomplete } from './use-autocomplete'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InputGroupTextarea } from '@/components/ui/input-group'
import { useAutocompleteData } from '@/lib/hooks/use-autocomplete-data'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

interface PromptInputTextareaWithMentionsProps {
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Called when the resolved message (with mention context) is ready */
  onResolvedSubmit?: (fullText: string) => void
  /** Sync text value for external state management */
  value?: string
  onChange?: (value: string) => void
}

export function PromptInputTextareaWithMentions({
  placeholder = 'Ask about your ClickHouse data... (@ for tables, / for commands)',
  disabled,
  className,
  onResolvedSubmit,
  value: controlledValue,
  onChange: controlledOnChange,
}: PromptInputTextareaWithMentionsProps) {
  const hostId = useHostId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [internalValue, setInternalValue] = useState('')

  const value = controlledValue ?? internalValue
  const setValue = useCallback(
    (v: string) => {
      if (controlledOnChange) {
        controlledOnChange(v)
      } else {
        setInternalValue(v)
      }
    },
    [controlledOnChange]
  )

  const autocomplete = useAutocomplete()
  const { tables, resources, skills, commands, isLoading } =
    useAutocompleteData()

  // Build filterable items based on current trigger
  const allItems = useMemo<AutocompleteItem[]>(() => {
    if (autocomplete.state.trigger === '@') {
      return [...resources, ...tables, ...skills]
    }
    if (autocomplete.state.trigger === '/') {
      return commands.map((cmd) => ({
        id: `cmd-${cmd.name}`,
        type: 'command' as const,
        label: cmd.name,
        description: cmd.description,
        value: cmd.promptTemplate,
        group: 'Commands',
      }))
    }
    return []
  }, [autocomplete.state.trigger, tables, resources, skills, commands])

  // Filter items by query
  useEffect(() => {
    const query = autocomplete.state.query.toLowerCase()
    const filtered = query
      ? allItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        )
      : allItems
    autocomplete.setFilteredItems(filtered.slice(0, 50))
  }, [autocomplete.state.query, allItems, autocomplete.setFilteredItems])

  // Compute anchor position for popover
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null
  )
  useEffect(() => {
    if (
      autocomplete.state.isOpen &&
      autocomplete.state.triggerIndex >= 0 &&
      textareaRef.current
    ) {
      const textarea = textareaRef.current
      const rect = textarea.getBoundingClientRect()
      const coords = getCaretCoordinates(
        textarea,
        autocomplete.state.triggerIndex
      )
      setAnchor({
        top: rect.top + coords.top + coords.height + 4,
        left: rect.left + coords.left,
      })
    } else {
      setAnchor(null)
    }
  }, [
    autocomplete.state.isOpen,
    autocomplete.state.triggerIndex,
    autocomplete.state.query,
  ])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.currentTarget.value
      setValue(newValue)
      autocomplete.handleTextChange(newValue, e.currentTarget.selectionStart)
    },
    [setValue, autocomplete.handleTextChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const handled = autocomplete.handleKeyDown(e)
      if (handled) {
        // If Enter/Tab was handled and there are filtered items, perform selection
        if (
          (e.key === 'Enter' || e.key === 'Tab') &&
          autocomplete.filteredItems.length > 0
        ) {
          const selectedItem =
            autocomplete.filteredItems[autocomplete.state.selectedIndex]
          if (selectedItem) {
            autocomplete.handleSelect(selectedItem, textareaRef, setValue)
          }
        }
        return
      }

      // Normal Enter = submit form
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [autocomplete, setValue]
  )

  const handleSelect = useCallback(
    (item: AutocompleteItem) => {
      autocomplete.handleSelect(item, textareaRef, setValue)
    },
    [autocomplete.handleSelect, setValue]
  )

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || disabled) return

    const resolved = await resolveMentionContext(
      autocomplete.mentions,
      autocomplete.slashCommand,
      value,
      { hostId }
    )

    onResolvedSubmit?.(resolved)

    // Clear state
    setValue('')
    autocomplete.clear()
  }, [
    value,
    disabled,
    autocomplete.mentions,
    autocomplete.slashCommand,
    hostId,
    onResolvedSubmit,
    setValue,
    autocomplete.clear,
  ])

  const hasMentions =
    autocomplete.mentions.length > 0 || autocomplete.slashCommand !== null

  return (
    <div className="flex flex-col gap-1">
      {/* Mention badges */}
      {hasMentions && (
        <div className="flex flex-wrap gap-1 px-1">
          {autocomplete.slashCommand && (
            <SlashCommandBadge
              command={autocomplete.slashCommand}
              onRemove={() => autocomplete.clear()}
            />
          )}
          {autocomplete.mentions.map((mention) => (
            <MentionBadge
              key={mention.id}
              mention={mention}
              onRemove={autocomplete.removeMention}
            />
          ))}
        </div>
      )}

      {/* Textarea */}
      <InputGroupTextarea
        ref={textareaRef}
        name="message"
        className={cn('field-sizing-content max-h-48 min-h-16', className)}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      {/* Autocomplete popover */}
      <AutocompletePopover
        open={autocomplete.state.isOpen}
        trigger={autocomplete.state.trigger}
        query={autocomplete.state.query}
        anchor={anchor}
        items={autocomplete.filteredItems}
        selectedIndex={autocomplete.state.selectedIndex}
        onSelect={handleSelect}
        onClose={autocomplete.close}
      />
    </div>
  )
}
