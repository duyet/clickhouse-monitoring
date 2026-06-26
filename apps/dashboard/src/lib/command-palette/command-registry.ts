/**
 * Command palette registry — a lightweight, side-effect-free store for
 * PaletteCommand entries. Components and features can call `register` at
 * any time; the registry is a singleton so entries accumulate across the
 * app lifetime.
 *
 * The existing command palette UI (components/controls/command-palette.tsx)
 * reads directly from `menuItemsConfig`. This registry provides a parallel,
 * programmatic channel for dynamic or feature-specific commands.
 */

export interface PaletteCommand {
  /** Unique stable identifier. Registering the same id again overwrites. */
  id: string
  /** Display label shown in the palette list. */
  label: string
  /** Extra keywords used for fuzzy matching (not displayed). */
  keywords?: readonly string[]
  /** Route href to navigate to on activation (mutually exclusive with action). */
  href?: string
  /** Imperative callback invoked on activation. */
  action?: () => void
  /** Group heading for visual clustering in the palette UI. */
  group: 'navigation' | 'host' | 'action'
  /** Lucide icon name (string) for optional icon rendering. */
  icon?: string
}

export class CommandRegistry {
  private readonly commands = new Map<string, PaletteCommand>()

  /** Add or replace a command by id. */
  register(cmd: PaletteCommand): void {
    this.commands.set(cmd.id, cmd)
  }

  /** Remove a command by id. No-op if not registered. */
  unregister(id: string): void {
    this.commands.delete(id)
  }

  /** Return all registered commands in insertion order. */
  getAll(): PaletteCommand[] {
    return [...this.commands.values()]
  }

  /**
   * Search commands by query string. Matches against label (case-insensitive)
   * and any keywords. An empty query returns all commands.
   */
  search(query: string): PaletteCommand[] {
    const q = query.toLowerCase().trim()
    if (!q) return this.getAll()
    return this.getAll().filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(q))
    )
  }
}

/** Global singleton registry. Call `registerNavCommands()` once at app init. */
export const commandRegistry = new CommandRegistry()
