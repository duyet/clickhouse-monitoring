'use client'

import type { AutocompleteItem, Mention, SlashCommand } from './types'

import { useCallback, useRef, useState } from 'react'

// Generate simple unique IDs
let idCounter = 0
function uniqueId() {
  return `mention-${++idCounter}-${Date.now()}`
}

interface AutocompleteState {
  trigger: '@' | '/' | null
  query: string
  triggerIndex: number
  selectedIndex: number
  isOpen: boolean
}

const INITIAL_STATE: AutocompleteState = {
  trigger: null,
  query: '',
  triggerIndex: -1,
  selectedIndex: 0,
  isOpen: false,
}

export interface UseAutocompleteReturn {
  state: AutocompleteState
  mentions: Mention[]
  slashCommand: SlashCommand | null
  handleTextChange: (value: string, selectionStart: number) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean // returns true if handled
  handleSelect: (
    item: AutocompleteItem,
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    setText: (v: string) => void
  ) => void
  removeMention: (id: string) => void
  close: () => void
  clear: () => void
  filteredItems: AutocompleteItem[]
  setFilteredItems: (items: AutocompleteItem[]) => void
}

export function useAutocomplete(): UseAutocompleteReturn {
  const [state, setState] = useState<AutocompleteState>(INITIAL_STATE)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [slashCommand, setSlashCommand] = useState<SlashCommand | null>(null)
  const [filteredItems, setFilteredItems] = useState<AutocompleteItem[]>([])

  // Keep a ref to filteredItems for keyboard handlers to avoid stale closures
  const filteredItemsRef = useRef<AutocompleteItem[]>([])
  const stateRef = useRef<AutocompleteState>(INITIAL_STATE)

  const updateState = useCallback((next: AutocompleteState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const updateFilteredItems = useCallback((items: AutocompleteItem[]) => {
    filteredItemsRef.current = items
    setFilteredItems(items)
  }, [])

  const close = useCallback(() => {
    updateState(INITIAL_STATE)
  }, [updateState])

  const clear = useCallback(() => {
    setMentions([])
    setSlashCommand(null)
    updateState(INITIAL_STATE)
    updateFilteredItems([])
  }, [updateState, updateFilteredItems])

  const handleTextChange = useCallback(
    (value: string, selectionStart: number) => {
      // Scan backward from cursor to find a trigger character
      let triggerChar: '@' | '/' | null = null
      let triggerIdx = -1
      let query = ''

      for (let i = selectionStart - 1; i >= 0; i--) {
        const char = value[i]

        if (char === '@') {
          // @ is valid at position 0 or preceded by whitespace
          const preceding = i === 0 ? ' ' : value[i - 1]
          if (/\s/.test(preceding)) {
            triggerChar = '@'
            triggerIdx = i
            query = value.slice(i + 1, selectionStart)
          }
          break
        }

        if (char === '/') {
          // / is valid only at start of input (no non-whitespace before it)
          const before = value.slice(0, i)
          if (/^\s*$/.test(before)) {
            triggerChar = '/'
            triggerIdx = i
            query = value.slice(i + 1, selectionStart)
          }
          break
        }

        // If we hit whitespace that isn't preceded by a trigger, stop
        if (/\s/.test(char)) {
          break
        }
      }

      if (triggerChar !== null) {
        updateState({
          trigger: triggerChar,
          query,
          triggerIndex: triggerIdx,
          selectedIndex: 0,
          isOpen: true,
        })
      } else {
        // No active trigger — close if open
        if (stateRef.current.isOpen) {
          updateState(INITIAL_STATE)
        }
      }
    },
    [updateState]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      const current = stateRef.current
      if (!current.isOpen) return false

      const items = filteredItemsRef.current
      const count = items.length

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = count > 0 ? (current.selectedIndex + 1) % count : 0
          updateState({ ...current, selectedIndex: next })
          return true
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev =
            count > 0 ? (current.selectedIndex - 1 + count) % count : 0
          updateState({ ...current, selectedIndex: prev })
          return true
        }
        case 'Enter':
        case 'Tab': {
          if (count === 0) return false
          e.preventDefault()
          // Caller (AutocompletePopover integration) should call handleSelect
          // We signal "handled" and the parent component calls handleSelect with
          // items[selectedIndex]. Returning true here lets the chat area intercept.
          return true
        }
        case 'Escape': {
          e.preventDefault()
          updateState(INITIAL_STATE)
          return true
        }
        default:
          return false
      }
    },
    [updateState]
  )

  const handleSelect = useCallback(
    (
      item: AutocompleteItem,
      textareaRef: React.RefObject<HTMLTextAreaElement | null>,
      setText: (v: string) => void
    ) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const current = stateRef.current
      const value = textarea.value
      const cursorPos = textarea.selectionStart ?? value.length

      // Build replacement text
      const replacement =
        item.type === 'command' ? `/${item.label} ` : `@${item.label} `

      const newValue =
        value.slice(0, current.triggerIndex) +
        replacement +
        value.slice(cursorPos)

      setText(newValue)

      // Move cursor to end of inserted text
      const newCursor = current.triggerIndex + replacement.length
      // Schedule cursor move after re-render
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursor
          textareaRef.current.selectionEnd = newCursor
        }
      })

      // Track the selection
      if (item.type === 'command') {
        setSlashCommand({
          name: item.value,
          label: `/${item.label}`,
          description: item.description ?? '',
          promptTemplate: item.value,
        })
      } else {
        setMentions((prev) => {
          // Avoid duplicate mentions
          if (prev.some((m) => m.value === item.value)) return prev
          return [
            ...prev,
            {
              id: uniqueId(),
              type: item.type as Mention['type'],
              label: item.label,
              value: item.value,
              database:
                item.type === 'table' ? item.value.split('.')[0] : undefined,
              table:
                item.type === 'table' ? item.value.split('.')[1] : undefined,
            },
          ]
        })
      }

      updateState(INITIAL_STATE)
    },
    [updateState]
  )

  const removeMention = useCallback((id: string) => {
    setMentions((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return {
    state,
    mentions,
    slashCommand,
    handleTextChange,
    handleKeyDown,
    handleSelect,
    removeMention,
    close,
    clear,
    filteredItems,
    setFilteredItems: updateFilteredItems,
  }
}
