export interface MenuItem {
  title: string
  href: string
  description?: string
  countSql?: string
  items?: MenuItem[]
}
