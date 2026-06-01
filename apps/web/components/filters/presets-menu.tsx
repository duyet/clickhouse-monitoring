'use client'

import { SparklesIcon } from 'lucide-react'

import type { FilterPreset } from '@/lib/filters/types'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PresetsMenuProps {
  presets: FilterPreset[]
  onApply: (preset: FilterPreset) => void
}

/** Dropdown of one-click filter bundles. */
export function PresetsMenu({ presets, onApply }: PresetsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 px-3 rounded-lg">
          <SparklesIcon className="size-3.5" />
          Presets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {presets.map((preset) => {
          const PresetIcon = preset.icon
          return (
            <DropdownMenuItem
              key={preset.name}
              onClick={() => onApply(preset)}
              className="gap-2"
            >
              {PresetIcon && (
                <PresetIcon className="size-4 text-muted-foreground" />
              )}
              {preset.name}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
