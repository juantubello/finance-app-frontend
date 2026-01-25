'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { getMonthName } from '@/src/lib/format'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: getMonthName(i + 1),
}))

const currentYear = new Date().getFullYear()
// 5 years back + current year + 5 years forward = 11 years total
const YEARS = Array.from({ length: 11 }, (_, i) => ({
  value: String(currentYear + 5 - i),
  label: String(currentYear + 5 - i),
}))

export function MonthYearSelector() {
  const { year, month, setMonth, setYear } = useMonthYear()

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
        <SelectTrigger className="w-full sm:w-[130px]" size="sm">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
        <SelectTrigger className="w-full sm:w-[90px]" size="sm">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y.value} value={y.value}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
