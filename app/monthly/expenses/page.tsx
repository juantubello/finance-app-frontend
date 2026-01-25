'use client'

import { useState, useEffect } from 'react'
import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TransactionTable } from '@/src/components/TransactionTable'
import { CategoryBreakdown } from '@/src/components/CategoryBreakdown'
import { LoadingPage } from '@/src/components/LoadingState'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { fetchMonthlyExpenses, fetchCardStatements, fetchCardCategories, fetchMonthlyIncome } from '@/src/lib/api'
import type { MonthlyListResponse, Transaction } from '@/src/types/finance'
import type { CardStatementsResponse, CardCategoriesResponse } from '@/src/lib/api'
import { CardConsumosTable } from '@/src/components/CardConsumosTable'
import { RealVsObjectiveComparison } from '@/src/components/RealVsObjectiveComparison'
import { Receipt, CreditCard, CalendarClock, Banknote } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
  Legend,
} from 'recharts'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function ExpensesPage() {
  const { year, month } = useMonthYear()
  const [data, setData] = useState<MonthlyListResponse<Transaction> | null>(null)
  const [incomeData, setIncomeData] = useState<MonthlyListResponse<Transaction> | null>(null)
  const [cardData, setCardData] = useState<CardStatementsResponse | null>(null)
  const [cardCategories, setCardCategories] = useState<CardCategoriesResponse | null>(null)
  const [selectedCard, setSelectedCard] = useState<'visa' | 'mastercard'>('visa')
  const [loading, setLoading] = useState(true)
  const [loadingCards, setLoadingCards] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [expensesData, incomeDataResult] = await Promise.all([
          fetchMonthlyExpenses(year, month),
          fetchMonthlyIncome(year, month),
        ])
        setData(expensesData)
        setIncomeData(incomeDataResult)
      } catch (err) {
        console.error('Error loading expenses:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los gastos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [year, month])

  useEffect(() => {
    const loadCardData = async () => {
      setLoadingCards(true)
      try {
        const [statements, categories] = await Promise.all([
          fetchCardStatements(year, month),
          fetchCardCategories(year, month),
        ])
        setCardData(statements)
        setCardCategories(categories)
      } catch (err) {
        console.error('Error loading card data:', err)
      } finally {
        setLoadingCards(false)
      }
    }

    loadCardData()
  }, [year, month])

  if (loading) {
    return (
      <div>
        <Header title="Gastos Mensual" />
        <LoadingPage />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Gastos Mensual" />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'No se pudieron cargar los gastos'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get unique categories from data for the filter
  const categories = Array.from(new Set(data.items.map(t => t.category))).sort()

  // Prepare chart data from categories
  const chartData = cardCategories?.categories.map((cat) => ({
    categoria: cat.categoria,
    total: cat.total,
  })) || []

  const COLORS = ['#16a34a', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#64748b']

  // Get consumos for selected card
  const currentConsumos = cardData?.consumos[selectedCard] || []


  return (
    <div>
      <Header title="Gastos Mensual" />
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Period indicator */}
        <div className="text-sm text-muted-foreground">
          Gastos de {getMonthName(month)} {year}
        </div>

        {/* Summary Card with Total and Real vs Objetivo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Receipt className="h-5 w-5" />
                  <span className="font-medium">Total Gastos</span>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(data.totals.total)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totals.count} transacciones
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="pt-4 border-t">
              <div className="mb-4">
                <CardTitle className="text-base font-medium">Real vs Objetivo</CardTitle>
              </div>
              <RealVsObjectiveComparison 
                expenses={data.items}
                totalExpenses={data.totals.total}
                totalIncome={incomeData?.totals.total || 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          {/* Table - takes 2 columns, shows ~16 rows */}
          <div className="lg:col-span-2 flex flex-col">
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable 
                  transactions={data.items} 
                  categories={categories}
                />
              </CardContent>
            </Card>
          </div>

          {/* Breakdown - takes 1 column */}
          <div className="h-full">
            <CategoryBreakdown breakdown={data.breakdown} />
          </div>
        </div>

        {/* Tarjeta Section - Below Detalle de Gastos */}
        {loadingCards ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Cargando datos de tarjetas...</p>
            </CardContent>
          </Card>
        ) : cardData ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Resumen Tarjeta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total General - Most Important Card */}
              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CreditCard className="h-5 w-5" />
                      <span className="font-medium">Total General</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(cardData.total_visa + cardData.total_mastercard)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-muted-foreground">Visa</div>
                      <div className="font-semibold">{formatCurrency(cardData.total_visa)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">Mastercard</div>
                      <div className="font-semibold">{formatCurrency(cardData.total_mastercard)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CalendarClock className="h-4 w-4" />
                    Total Cuotas
                  </div>
                  <div className="text-xl font-bold">{formatCurrency(cardData.total_cuotas)}</div>
                  <p className="text-xs text-muted-foreground">
                    {cardData.consumos.visa.filter(c => c.is_cuota).length + cardData.consumos.mastercard.filter(c => c.is_cuota).length} items en cuotas
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Banknote className="h-4 w-4" />
                    Pagos Únicos
                  </div>
                  <div className="text-xl font-bold">{formatCurrency(cardData.total_pagos_unicos)}</div>
                  <p className="text-xs text-muted-foreground">
                    {cardData.consumos.visa.filter(c => !c.is_cuota).length + cardData.consumos.mastercard.filter(c => !c.is_cuota).length} servicios/compras
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">VISA</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(cardData.total_visa)}</div>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <span className="text-red-600 dark:text-red-400 font-bold">MASTERCARD</span>
                  </div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(cardData.total_mastercard)}</div>
                </div>
              </div>

              {/* Chart and Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Gastos por Categoría</h4>
                  <div className="h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="categoria" 
                          width={120}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <LabelList 
                            dataKey="total" 
                            position="right"
                            formatter={(value: number) => formatCurrency(value)}
                            style={{ fontSize: '11px', fill: 'var(--foreground)' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consumos Table */}
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium mb-4">Detalle de Consumos</h4>
                  <Tabs value={selectedCard} onValueChange={(v) => setSelectedCard(v as 'visa' | 'mastercard')} className="flex-1 flex flex-col">
                    <TabsList className="mb-4">
                      <TabsTrigger value="visa" className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">VISA</span>
                      </TabsTrigger>
                      <TabsTrigger value="mastercard" className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400 font-bold">MASTERCARD</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value={selectedCard} className="mt-0 flex-1 flex flex-col min-h-0">
                      <div className="flex-1 min-h-[600px]">
                        <CardConsumosTable consumos={currentConsumos} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
