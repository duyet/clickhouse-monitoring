/**
 * This page uses Next.js parallel routes pattern.
 * The actual content is rendered through parallel route slots in layout.tsx:
 * - @view for VIEW tables
 * - @dictionary for Dictionary tables
 * - @materializedview for MaterializedView tables
 * - @mergetree for MergeTree tables
 *
 * The empty fragment is intentional as the layout handles all content rendering.
 */
export default function Page() {
  return <></>
}
