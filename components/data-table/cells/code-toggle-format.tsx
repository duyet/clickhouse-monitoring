import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface CodeToggleFormatProps {
  row: any
  value: any
}

const CODE_TRUNCATE_LENGTH = 50

export function CodeToggleFormat({ row, value }: CodeToggleFormatProps) {
  if (value.length < CODE_TRUNCATE_LENGTH) {
    return <code>{value}</code>
  }

  return (
    <Accordion
      type="single"
      defaultValue={row.getIsExpanded() ? 'code' : undefined}
      collapsible={row.getIsExpanded()}
      onValueChange={(value) => row.toggleExpanded(value === 'code')}
    >
      <AccordionItem value="code" className="border-0">
        <AccordionTrigger className="py-0 hover:no-underline">
          <code className="truncate break-words font-normal">
            {value.substring(0, 50)}...
          </code>
        </AccordionTrigger>
        <AccordionContent>
          <code className="whitespace-pre-wrap font-normal text-stone-500">
            {value}
          </code>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
