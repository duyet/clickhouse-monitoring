'use client'

import { ColumnsIcon, KeyIcon } from 'lucide-react'

import { TreeNode } from './tree-node'
import { Badge } from '@/components/ui/badge'

interface ColumnNodeProps {
  name: string
  type: string
  isInPrimaryKey?: boolean
  isInSortingKey?: boolean
  level: number
}

export function ColumnNode({
  name,
  type,
  isInPrimaryKey,
  isInSortingKey,
  level,
}: ColumnNodeProps) {
  const icon = isInPrimaryKey || isInSortingKey ? KeyIcon : ColumnsIcon

  return (
    <TreeNode
      label={name}
      icon={icon}
      level={level}
      badge={
        <Badge variant="outline" className="text-xs">
          {type}
        </Badge>
      }
    />
  )
}
