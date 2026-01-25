'use client'

import { MonthYearSelector } from './MonthYearSelector'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { getMonthName } from '@/src/lib/format'

interface HeaderProps {
  title: string
  showMonthYear?: boolean
}

export function Header({ title, showMonthYear = true }: HeaderProps) {
  const { year, month } = useMonthYear()

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 w-full max-w-full">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {showMonthYear && (
            <p className="text-sm text-muted-foreground md:hidden">
              {getMonthName(month)} {year}
            </p>
          )}
        </div>
        {showMonthYear && (
          <div className="hidden md:block">
            <MonthYearSelector />
          </div>
        )}
      </div>
      {showMonthYear && (
        <div className="md:hidden px-4 pb-3">
          <MonthYearSelector />
        </div>
      )}
    </header>
  )
}
