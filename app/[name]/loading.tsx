import { UpdateIcon } from '@radix-ui/react-icons'

export default function Loading() {
  return (
    <div className='flex flex-row items-center gap-3'>
      <UpdateIcon className='h-4 w-4 animate-spin' />
      Loading...
    </div>
  )
}
