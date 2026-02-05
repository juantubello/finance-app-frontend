'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionTable } from '@/src/components/TransactionTable'
import { ExchangeRateCard } from '@/src/components/ExchangeRateCard'
import { LoadingPage } from '@/src/components/LoadingState'
import { formatCurrency, getMonthName, getShortMonthName } from '@/src/lib/format'
import { fetchMonthlyIncome, fetchAnnualIncome } from '@/src/lib/api'
import type { MonthlyListResponse, Transaction } from '@/src/types/finance'
import { Wallet } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function IncomePage() {
  const { year, month } = useMonthYear()
  const [data, setData] = useState<MonthlyListResponse<Transaction> | null>(null)
  const [annualData, setAnnualData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [incomeData, annualIncomeData] = await Promise.all([
          fetchMonthlyIncome(year, month),
          fetchAnnualIncome(year).catch(() => null) // Si falla, no es crítico
        ])
        setData(incomeData)
        setAnnualData(annualIncomeData)
      } catch (err) {
        console.error('Error loading income:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los ingresos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [year, month])

  // Prepare chart data for income evolution
  const incomeChartData = useMemo(() => {
    if (!annualData?.data || annualData.data.length === 0) return []
    
    // Group by month - sum all categories for each month
    const byMonth = new Map<number, number>()
    annualData.data.forEach((item: { month: number; total: number }) => {
      const monthNum = item.month
      const current = byMonth.get(monthNum) || 0
      byMonth.set(monthNum, current + (item.total || 0))
    })
    
    // Create array for all months up to current month
    return Array.from({ length: month }, (_, i) => {
      const monthNum = i + 1
      const amount = byMonth.get(monthNum) || 0
      return {
        name: getShortMonthName(monthNum),
        Ingresos: amount,
      }
    })
  }, [annualData, month])

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

          {/* Income Evolution Chart - takes 1 column */}
          <div>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Evolución del Sueldo {year}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                {incomeChartData.length > 0 ? (
                  <>
                    <div className="h-[200px] mb-4 flex-shrink-0 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={incomeChartData} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10 }}
                            className="text-muted-foreground"
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => {
                              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                              return `$${value}`
                            }}
                            className="text-muted-foreground"
                          />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'var(--card)', 
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Ingresos" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Summary stats */}
                    <div className="space-y-2 pt-2 border-t">
                      {data.breakdown.map((item, index) => (
                        <div key={item.category} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0 bg-green-600"
                            />
                            <span className="text-sm truncate">{item.category}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-sm font-medium leading-tight">{formatCurrency(item.amount)}</div>
                            <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                              {item.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {data.breakdown.map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 bg-green-600"
                          />
                          <span className="text-sm truncate">{item.category}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-medium leading-tight">{formatCurrency(item.amount)}</div>
                          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                            {item.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
