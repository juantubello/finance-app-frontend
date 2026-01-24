'use client'

import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionTable } from '@/src/components/TransactionTable'
import { CategoryBreakdown } from '@/src/components/CategoryBreakdown'
import { ExchangeRateCard } from '@/src/components/ExchangeRateCard'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { USE_DEMO_DATA } from '@/src/lib/api'
import { getDemoMonthlySavings, SAVINGS_CATEGORIES } from '@/src/lib/dummy'
import { PiggyBank } from 'lucide-react'

export default function SavingsPage() {
  const { year, month } = useMonthYear()

  // TODO: Replace with actual API call when backend is ready
  const data = USE_DEMO_DATA 
    ? getDemoMonthlySavings(year, month)
    : null

  if (!data) {
    return (
      <div>
        <Header title="Ahorros Mensual" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Ahorros Mensual" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Period indicator */}
        <div className="text-sm text-muted-foreground">
          Ahorros de {getMonthName(month)} {year}
        </div>

        {/* Exchange Rate */}
        <ExchangeRateCard showBtc={false} />

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ahorros</CardTitle>
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.totals.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totals.count} movimientos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table - takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Ahorros</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable 
                  transactions={data.items} 
                  categories={SAVINGS_CATEGORIES}
                />
              </CardContent>
            </Card>
          </div>

          {/* Breakdown - takes 1 column */}
          <div>
            <CategoryBreakdown breakdown={data.breakdown} title="Por Tipo" />
          </div>
        </div>
      </div>
    </div>
  )
}
