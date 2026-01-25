'use client'

import { useState, useEffect } from 'react'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionTable } from '@/src/components/TransactionTable'
import { ExchangeRateCard } from '@/src/components/ExchangeRateCard'
import { LoadingPage } from '@/src/components/LoadingState'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { fetchMonthlySavings } from '@/src/lib/api'
import type { Transaction } from '@/src/types/finance'
import type { MonthlySavingsResponse } from '@/src/lib/api'
import { PiggyBank, DollarSign } from 'lucide-react'

export default function SavingsPage() {
  const { year, month } = useMonthYear()
  const [data, setData] = useState<MonthlySavingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const savingsData = await fetchMonthlySavings(year, month)
        setData(savingsData)
      } catch (err) {
        console.error('Error loading savings:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los ahorros')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [year, month])

  if (loading) {
    return (
      <div>
        <Header title="Ahorros Mensual" />
        <LoadingPage />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Ahorros Mensual" />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'No se pudieron cargar los ahorros'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get unique categories from data for the filter
  const categoriesARS = Array.from(new Set(data.items_ars.map(t => t.category))).sort()
  const categoriesUSD = Array.from(new Set(data.items_usd.map(t => t.category))).sort()

  return (
    <div>
      <Header title="Ahorros Mensual" />
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Period indicator */}
        <div className="text-sm text-muted-foreground">
          Ahorros de {getMonthName(month)} {year}
        </div>

        {/* Exchange Rate */}
        <ExchangeRateCard showBtc={false} />

        {/* Summary Cards - ARS and USD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Ahorros ARS */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ahorros en Pesos</CardTitle>
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.total_ars)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.items_ars.length} movimientos
              </p>
            </CardContent>
          </Card>

          {/* Card Ahorros USD */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ahorros en Dólares</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.total_usd, 'USD')}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.items_usd.length} movimientos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="space-y-6">
          {/* Card ARS */}
          {data.items_ars.length > 0 && (
            <Card className="flex flex-col min-h-[600px]">
              <CardHeader>
                <CardTitle>Ahorros en Pesos</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden">
                  <TransactionTable 
                    transactions={data.items_ars} 
                    categories={categoriesARS}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card USD */}
          {data.items_usd.length > 0 && (
            <Card className="flex flex-col min-h-[600px]">
              <CardHeader>
                <CardTitle>Ahorros en Dólares</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden">
                  <TransactionTable 
                    transactions={data.items_usd} 
                    categories={categoriesUSD}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
