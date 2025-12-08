import type React from 'react'

interface LayoutProps {
  children: React.ReactNode
  mergetree: React.ReactNode
  dictionary: React.ReactNode
  materializedview: React.ReactNode
  view: React.ReactNode
}

export default function Layout({
  view,
  dictionary,
  materializedview,
  mergetree,
}: LayoutProps) {
  return (
    <div>
      {view}
      {dictionary}
      {materializedview}
      {mergetree}
    </div>
  )
}
