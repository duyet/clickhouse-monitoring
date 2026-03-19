'use client'

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileCode2Icon,
  ListTreeIcon,
} from 'lucide-react'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface SkillDialogSkill {
  name: string
  description: string
  content: string
}

interface SkillsTreeDialogProps {
  skills: SkillDialogSkill[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SkillTreeNode {
  id: string
  title: string
  level: number
  body: string[]
  children: SkillTreeNode[]
}

type SkillBodyBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; content: string }

function buildSkillTree(skill: SkillDialogSkill): SkillTreeNode {
  const root: SkillTreeNode = {
    id: skill.name,
    title: skill.name,
    level: 0,
    body: [],
    children: [],
  }
  const lines = skill.content.split('\n')
  const stack = [root]
  let prefaceNode: SkillTreeNode | null = null
  let sectionCount = 0

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line)

    if (headingMatch) {
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()

      if (level === 1 && sectionCount === 0) {
        root.title = title || skill.name
        sectionCount += 1
        continue
      }

      const node: SkillTreeNode = {
        id: `${skill.name}-${sectionCount}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title,
        level,
        body: [],
        children: [],
      }

      while (stack.length > 1 && stack.at(-1)!.level >= level) {
        stack.pop()
      }

      stack.at(-1)!.children.push(node)
      stack.push(node)
      sectionCount += 1
      continue
    }

    if (line.trim().length === 0 && stack.at(-1)?.body.at(-1) === '') {
      continue
    }

    if (stack.length === 1) {
      if (!prefaceNode) {
        prefaceNode = {
          id: `${skill.name}-overview`,
          title: 'Overview',
          level: 1,
          body: [],
          children: [],
        }
        root.children.push(prefaceNode)
      }
      prefaceNode.body.push(line)
      continue
    }

    stack.at(-1)!.body.push(line)
  }

  return root
}

function createBodyBlocks(lines: string[]): SkillBodyBlock[] {
  const blocks: SkillBodyBlock[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let codeLines: string[] = []
  let inCode = false

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: paragraph.join(' ').trim(),
      })
      paragraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({
        type: 'list',
        items: [...listItems],
      })
      listItems = []
    }
  }

  const flushCode = () => {
    if (codeLines.length > 0) {
      blocks.push({
        type: 'code',
        content: codeLines.join('\n').trimEnd(),
      })
      codeLines = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ')
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph()
      flushList()
      if (inCode) {
        flushCode()
      }
      inCode = !inCode
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (trimmed.length === 0) {
      flushParagraph()
      flushList()
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      listItems.push(trimmed.replace(/^[-*]\s+/, ''))
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''))
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushCode()

  return blocks
}

function SkillBody({ lines }: { lines: string[] }) {
  const blocks = useMemo(() => createBodyBlocks(lines), [lines])

  if (blocks.length === 0) return null

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p
              key={`${block.type}-${index}`}
              className="text-sm leading-6 text-muted-foreground"
            >
              {block.content}
            </p>
          )
        }

        if (block.type === 'list') {
          return (
            <ul
              key={`${block.type}-${index}`}
              className="space-y-2 text-sm text-muted-foreground"
            >
              {block.items.map((item) => (
                <li key={item} className="flex gap-2 leading-6">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <pre
            key={`${block.type}-${index}`}
            className="overflow-x-auto rounded-xl border bg-muted/60 p-3 text-xs leading-5 text-foreground"
          >
            <code>{block.content}</code>
          </pre>
        )
      })}
    </div>
  )
}

function SkillTreeNodeView({
  node,
  depth = 0,
}: {
  node: SkillTreeNode
  depth?: number
}) {
  const hasChildren = node.children.length > 0
  const hasBody = node.body.some((line) => line.trim().length > 0)
  const [open, setOpen] = useState(depth < 2)

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute bottom-0 left-3 top-0 w-px bg-border/80" />
      )}

      <div className="relative pl-6">
        {depth > 0 && (
          <div className="absolute left-3 top-6 h-px w-4 bg-border/80" />
        )}

        <div className="rounded-2xl border bg-card/80 shadow-sm">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              {hasChildren || hasBody ? (
                open ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )
              ) : (
                <FileCode2Icon className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {node.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {hasChildren
                  ? `${node.children.length} section${node.children.length === 1 ? '' : 's'}`
                  : hasBody
                    ? 'Details'
                    : 'Leaf node'}
              </div>
            </div>
          </button>

          {open && (hasBody || hasChildren) ? (
            <div className="space-y-4 border-t px-4 py-4">
              {hasBody ? <SkillBody lines={node.body} /> : null}
              {hasChildren ? (
                <div className="space-y-3">
                  {node.children.map((child) => (
                    <SkillTreeNodeView
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function SkillsTreeDialog({
  skills,
  open,
  onOpenChange,
}: SkillsTreeDialogProps) {
  const trees = useMemo(
    () => skills.map((skill) => buildSkillTree(skill)),
    [skills]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[min(96vw,64rem)] overflow-hidden border-border/80 p-0">
        <DialogHeader className="border-b bg-muted/30 px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-background">
              <BookOpenIcon className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="truncate text-left text-xl">
                Skills tree
              </DialogTitle>
              <DialogDescription className="text-left leading-6">
                Browse the bundled skills as an expandable tree of headings,
                notes, and code examples.
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
              <ListTreeIcon className="h-3.5 w-3.5" />
              Tree view
            </span>
            <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1">
              {trees.length} skill{trees.length === 1 ? '' : 's'}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="space-y-4 p-6">
            {trees.map((tree, index) => {
              const skill = skills[index]

              return (
                <div
                  key={skill.name}
                  className="rounded-2xl border bg-card/80 p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="truncate text-base font-semibold">
                        {skill.name}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {skill.description.replace(/^"|"$/g, '')}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                      {tree.children.length} section
                      {tree.children.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {tree.body.length > 0 ? (
                    <div className="mb-4 rounded-2xl border bg-muted/20 p-4">
                      <div className="mb-3 text-sm font-medium">Overview</div>
                      <SkillBody lines={tree.body} />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      'space-y-3',
                      tree.body.length === 0 && 'pt-1'
                    )}
                  >
                    {tree.children.map((child) => (
                      <SkillTreeNodeView key={child.id} node={child} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
