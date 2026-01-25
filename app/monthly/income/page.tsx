'use client'

import { useState, useEffect } from 'react'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionTable } from '@/src/components/TransactionTable'
import { CategoryBreakdown } from '@/src/components/CategoryBreakdown'
import { ExchangeRateCard } from '@/src/components/ExchangeRateCard'
import { LoadingPage } from '@/src/components/LoadingState'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { fetchMonthlyIncome } from '@/src/lib/api'
import type { MonthlyListResponse, Transaction } from '@/src/types/finance'
import { Wallet } from 'lucide-react'

export default function IncomePage() {
  const { year, month } = useMonthYear()
  const [data, setData] = useState<MonthlyListResponse<Transaction> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const incomeData = await fetchMonthlyIncome(year, month)
        setData(incomeData)
      } catch (err) {
        console.error('Error loading income:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los ingresos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [year, month])

  if (loading) {
    return (
      <div>
        <Header title="Ingresos Mensual" />
        <LoadingPage />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Ingresos Mensual" />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'No se pudieron cargar los ingresos'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get unique categories from data for the filter
  const categories = Array.from(new Set(data.items.map(t => t.category))).sort()

  return (
    <div>
      <Header title="Ingresos Mensual" />
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Period indicator */}
        <div className="text-sm text-muted-foreground">
          Ingresos de {getMonthName(month)} {year}
        </div>

        {/* Exchange Rate */}
        <ExchangeRateCard showBtc={false} />

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.totals.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totals.count} transacciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Table - takes 2 columns, stretches to fill */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-[600px]">
              <CardHeader>
                <CardTitle>Detalle de Ingresos</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden">
                  <TransactionTable 
                    transactions={data.items} 
                    categories={categories}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown - takes 1 column */}
          <div>
            <CategoryBreakdown breakdown={data.breakdown} title="Por Fuente" />
          </div>
        </div>
      </div>
    </div>
  )
}
