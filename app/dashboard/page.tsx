'use client'

import { useState, useEffect } from 'react'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingPage } from '@/src/components/LoadingState'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { fetchMonthlySummary, fetchCurrentLiquidity } from '@/src/lib/api'
import type { MonthlySummary } from '@/src/types/finance'
import { ArrowDownIcon, ArrowUpIcon, PiggyBankIcon, ScaleIcon, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6']

export default function DashboardPage() {
  const { year, month } = useMonthYear()
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [liquidity, setLiquidity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingLiquidity, setLoadingLiquidity] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const summaryData = await fetchMonthlySummary(year, month)
        setSummary(summaryData)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [year, month])

  useEffect(() => {
    const loadLiquidity = async () => {
      setLoadingLiquidity(true)
      try {
        const liquidityData = await fetchCurrentLiquidity()
        setLiquidity(liquidityData.current)
      } catch (err) {
        console.error('Error loading liquidity:', err)
        // Don't set error, just keep null
      } finally {
        setLoadingLiquidity(false)
      }
    }

    loadLiquidity()
  }, [])

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" />
        <LoadingPage />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'No se pudieron cargar los datos del dashboard'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pieData = summary.topCategories.map((cat) => ({
    name: cat.category,
    value: cat.amount,
  }))

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Period indicator */}
        <div className="text-sm text-muted-foreground">
          Resumen de {getMonthName(month)} {year}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Liquidez - Primera */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponible</CardTitle>
              <Wallet className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              {loadingLiquidity ? (
                <div className="text-2xl font-bold text-cyan-600 animate-pulse">
                  Cargando...
                </div>
              ) : (
                <div className="text-2xl font-bold text-cyan-600">
                  {liquidity !== null ? formatCurrency(liquidity) : formatCurrency(0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <ArrowDownIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egresos</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ahorros</CardTitle>
              <PiggyBankIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalSavings)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <ScaleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Top Categorías de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.topCategories.map((cat, index) => (
                  <div key={cat.category} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{cat.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(cat.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
