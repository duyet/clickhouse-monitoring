'use client'

import type * as React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface TableProps extends React.ComponentProps<'table'> {
  layout?: 'auto' | 'fixed'
}

function TableBase({ className, layout = 'auto', ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(
          'w-full caption-bottom text-sm',
          layout === 'fixed' ? 'table-fixed' : 'table-auto',
          className
        )}
        {...props}
      />
    </div>
  )
}

interface TableHeaderProps extends React.ComponentProps<'thead'> {
  variant?: 'default' | 'compact'
}

function TableHeader({
  className,
  variant = 'default',
  ...props
}: TableHeaderProps) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        '[&_tr]:border-b bg-muted/95 backdrop-blur-xs sticky top-0 z-10',
        variant === 'compact' && '[&_th]:py-1 [&_th]:text-xs',
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

interface TableRowProps extends React.ComponentProps<'tr'> {
  variant?: 'default' | 'selected'
}

function TableRow({ className, variant = 'default', ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 border-b transition-colors',
        variant === 'selected' &&
          'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 data-[state=selected]:bg-primary/10',
        className
      )}
      {...props}
    />
  )
}

interface TableHeadProps extends React.ComponentProps<'th'> {
  sticky?: 'left' | 'right'
}

function TableHead({ className, sticky, ...props }: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-4 text-left align-middle font-medium sm:whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        sticky === 'left' &&
          'sticky left-0 z-10 bg-background shadow-[1px_0_0_0_rgba(0,0,0,0.1)]',
        sticky === 'right' &&
          'sticky right-0 z-10 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]',
        className
      )}
      {...props}
    />
  )
}

interface TableCellProps extends React.ComponentProps<'td'> {
  sticky?: 'left' | 'right'
}

function TableCell({ className, sticky, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-4 align-middle sm:whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        sticky === 'left' &&
          'sticky left-0 z-10 bg-background shadow-[1px_0_0_0_rgba(0,0,0,0.1)]',
        sticky === 'right' &&
          'sticky right-0 z-10 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

interface TableCheckHeadProps extends React.ComponentProps<typeof TableHead> {
  checked?: boolean | 'indeterminate'
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean | 'indeterminate') => void
}

function TableCheckHead({
  checked,
  indeterminate,
  onCheckedChange,
  className,
  ...props
}: TableCheckHeadProps) {
  return (
    <TableHead
      className={cn('w-[48px] px-2 text-center align-middle', className)}
      {...props}
    >
      <div className="flex items-center justify-center">
        <Checkbox
          checked={indeterminate ? 'indeterminate' : checked}
          onCheckedChange={onCheckedChange}
          aria-label={props['aria-label'] || 'Select all rows'}
        />
      </div>
    </TableHead>
  )
}

interface TableCheckCellProps extends React.ComponentProps<typeof TableCell> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function TableCheckCell({
  checked,
  onCheckedChange,
  className,
  ...props
}: TableCheckCellProps) {
  return (
    <TableCell
      className={cn('w-[48px] px-2 text-center align-middle', className)}
      {...props}
    >
      <div className="flex items-center justify-center">
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => onCheckedChange?.(val === true)}
          aria-label={props['aria-label'] || 'Select row'}
        />
      </div>
    </TableCell>
  )
}

interface TableResizeHandleProps extends React.ComponentProps<'div'> {
  'aria-valuenow'?: number
}

function TableResizeHandle({
  className,
  'aria-valuenow': ariaValueNow,
  ...props
}: TableResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={ariaValueNow ?? 0}
      className={cn(
        'absolute right-0 top-0 z-20 h-full w-2 -mr-1 cursor-col-resize select-none touch-none',
        'after:absolute after:right-1 after:top-0 after:h-full after:w-px',
        'after:bg-border/60 hover:after:bg-primary active:after:bg-primary',
        'after:transition-colors',
        className
      )}
      {...props}
    />
  )
}

// Typed compound component: callable Table function + static sub-components
interface TableComponent
  extends React.FC<React.ComponentProps<typeof TableBase>> {
  Header: typeof TableHeader
  Body: typeof TableBody
  Row: typeof TableRow
  Head: typeof TableHead
  Cell: typeof TableCell
  Footer: typeof TableFooter
  CheckHead: typeof TableCheckHead
  CheckCell: typeof TableCheckCell
  ResizeHandle: typeof TableResizeHandle
  Caption: typeof TableCaption
}

const Table = Object.assign(TableBase, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Footer: TableFooter,
  CheckHead: TableCheckHead,
  CheckCell: TableCheckCell,
  ResizeHandle: TableResizeHandle,
  Caption: TableCaption,
}) as TableComponent

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
  TableCheckHead,
  TableCheckCell,
  TableResizeHandle,
  TableCaption,
}
