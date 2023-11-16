import { Menu } from '@/components/menu'
import { ReloadButton } from '@/components/reload-button'


export function Header() {
  return (
    <div className='flex items-center justify-between space-y-2'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>
          ClickHouse Monitoring
        </h2>
        <p className='text-muted-foreground'></p>
      </div>
      <div className='flex items-center space-x-2'>
        <Menu />
        <ReloadButton />
      </div>
    </div>
  )
}
