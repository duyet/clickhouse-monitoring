'use client'

import { Search } from 'lucide-react'

import { SidebarInput } from '@/components/ui/sidebar'

interface TreeSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TreeSearch({
  value,
  onChange,
  placeholder = 'Search tables...',
}: TreeSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <SidebarInput
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}
