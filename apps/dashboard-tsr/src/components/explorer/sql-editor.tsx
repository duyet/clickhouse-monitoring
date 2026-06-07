import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language'
import { searchKeymap } from '@codemirror/search'
import { Compartment, EditorState, Transaction } from '@codemirror/state'
import {
  placeholder as cmPlaceholder,
  EditorView,
  keymap,
} from '@codemirror/view'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef } from 'react'

// The app's design tokens are OKLCH colors (e.g. `--popover: oklch(1 0 0)`),
// NOT HSL channel triplets. Wrapping them in `hsl(var(--token))` yields an
// invalid color that the browser drops — which is why the autocomplete
// dropdown rendered transparent. Reference the tokens directly with
// `var(--token)`, and use `oklch(from … )` for alpha tints (same pattern as
// styles.css).
function buildTheme(dark: boolean) {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      },
      '.cm-content': {
        caretColor: 'var(--foreground)',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        fontSize: '0.875rem',
        lineHeight: '1.5',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--muted)',
        color: 'var(--muted-foreground)',
        border: 'none',
      },
      '.cm-activeLine': {
        backgroundColor: `oklch(from var(--muted) l c h / ${dark ? 0.5 : 0.3})`,
      },
      '.cm-activeLineGutter': {
        backgroundColor: `oklch(from var(--muted) l c h / ${dark ? 0.8 : 0.5})`,
      },
      '.cm-selectionMatch': {
        backgroundColor: 'oklch(from var(--accent) l c h / 0.3)',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--foreground)',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: `oklch(from var(--accent) l c h / ${dark ? 0.4 : 0.3})`,
      },
      '&.cm-focused': {
        outline: 'none',
      },
      // Tooltips and the autocomplete popup are floating layers with no parent
      // background, so they MUST set an opaque fill of their own.
      '.cm-tooltip': {
        backgroundColor: 'var(--popover)',
        color: 'var(--popover-foreground)',
        border: '1px solid var(--border)',
        borderRadius: '0.375rem',
        boxShadow:
          '0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul': {
        backgroundColor: 'var(--popover)',
        color: 'var(--popover-foreground)',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        fontSize: '0.8125rem',
        maxHeight: '16rem',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        padding: '0.125rem 0.5rem',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-foreground)',
      },
      '.cm-completionIcon': {
        color: 'var(--muted-foreground)',
      },
      '.cm-completionMatchedText': {
        color: 'var(--primary)',
        textDecoration: 'none',
        fontWeight: '600',
      },
    },
    { dark }
  )
}

const darkTheme = buildTheme(true)
const lightTheme = buildTheme(false)

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  placeholder?: string
  /** Database/table schema for SQL autocomplete: { "db.table": ["col1", "col2"] } */
  schema?: Record<string, string[]>
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  placeholder = 'SELECT * FROM system.tables LIMIT 100',
  schema,
}: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)
  const sqlCompartment = useRef(new Compartment())
  // Track programmatic document updates to avoid echoing onChange back to parent.
  const isProgrammaticChange = useRef(false)
  const { resolvedTheme } = useTheme()

  // Keep refs in sync
  onChangeRef.current = onChange
  onRunRef.current = onRun

  // Create editor on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — value/schema/placeholder are initial values; sync handled by separate effects
  useEffect(() => {
    if (!containerRef.current) return

    const runKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          onRunRef.current?.()
          return true
        },
      },
    ])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Ignore updates dispatched by value-sync effect to prevent feedback loops.
        const hasProgrammaticAnnotation = update.transactions.some(
          (tr) => tr.annotation(Transaction.userEvent) === 'input.programmatic'
        )
        if (isProgrammaticChange.current || hasProgrammaticAnnotation) {
          isProgrammaticChange.current = false
          return
        }
        onChangeRef.current(update.state.doc.toString())
      }
    })

    const theme = resolvedTheme === 'dark' ? darkTheme : lightTheme

    const state = EditorState.create({
      doc: value,
      extensions: [
        runKeymap,
        history(),
        bracketMatching(),
        autocompletion(),
        sqlCompartment.current.of(sql({ schema: schema || {} })),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...completionKeymap,
        ]),
        cmPlaceholder(placeholder),
        theme,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only recreate on theme change — value/schema sync handled separately
  }, [resolvedTheme])

  // Dynamically reconfigure SQL schema when it changes (e.g., databases load)
  useEffect(() => {
    const view = viewRef.current
    if (!view || !schema) return

    view.dispatch({
      effects: sqlCompartment.current.reconfigure(sql({ schema })),
    })
  }, [schema])

  // Sync external value changes (e.g., format button, URL prefill)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentDoc = view.state.doc.toString()
    if (currentDoc !== value) {
      isProgrammaticChange.current = true
      try {
        view.dispatch({
          changes: {
            from: 0,
            to: currentDoc.length,
            insert: value,
          },
          annotations: Transaction.userEvent.of('input.programmatic'),
        })
      } finally {
        isProgrammaticChange.current = false
      }
    }
  }, [value])

  // Focus helper for parent components
  const handleContainerClick = useCallback(() => {
    viewRef.current?.focus()
  }, [])

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="min-h-[120px] overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 [&_.cm-editor]:min-h-[120px]"
    />
  )
}
