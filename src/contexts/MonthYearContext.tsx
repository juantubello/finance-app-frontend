'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MonthYearContextType {
  year: number
  month: number
  setYear: (year: number) => void
  setMonth: (month: number) => void
  setMonthYear: (month: number, year: number) => void
}

const MonthYearContext = createContext<MonthYearContextType | undefined>(undefined)

export function MonthYearProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12

  const setMonthYear = (newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }

  return (
    <MonthYearContext.Provider value={{ year, month, setYear, setMonth, setMonthYear }}>
      {children}
    </MonthYearContext.Provider>
  )
}

export function useMonthYear() {
  const context = useContext(MonthYearContext)
  if (context === undefined) {
    throw new Error('useMonthYear must be used within a MonthYearProvider')
  }
  return context
}
