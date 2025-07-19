'use client'

import { MenuProvider } from '@/context/MenuContext'

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MenuProvider>{children}</MenuProvider>
}
