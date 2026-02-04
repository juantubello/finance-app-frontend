'use client'

import { ReactNode } from 'react'
import { MonthYearProvider } from '@/src/contexts/MonthYearContext'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'
import { AppFooter } from './AppFooter'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <MonthYearProvider>
      <div className="flex min-h-screen flex-col bg-background w-full overflow-x-hidden">
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <main className="flex-1 pb-20 md:pb-0 min-w-0 w-full flex flex-col">
            <div className="flex-1 min-h-0">
              {children}
            </div>
            <AppFooter />
          </main>
        </div>
        <MobileNav />
      </div>
    </MonthYearProvider>
  )
}
