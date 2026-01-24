'use client'

import { ReactNode } from 'react'
import { MonthYearProvider } from '@/src/contexts/MonthYearContext'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <MonthYearProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </MonthYearProvider>
  )
}
