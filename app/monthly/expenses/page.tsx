'use client'

import { useState, useEffect, useMemo } from 'react'
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
  const [selectedCard, setSelectedCard] = useState<'visa' | 'mastercard' | 'all'>('visa')
  const [loading, setLoading] = useState(true)
  const [loadingCards, setLoadingCards] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get consumos for selected card
  const currentConsumos = useMemo(() => {
    if (!cardData) return []
    if (selectedCard === 'all') {
      // Add card type information when combining both cards
      const visaConsumos = cardData.consumos.visa.map(c => ({ ...c, cardType: 'visa' as const }))
      const mastercardConsumos = cardData.consumos.mastercard.map(c => ({ ...c, cardType: 'mastercard' as const }))
      return [...visaConsumos, ...mastercardConsumos]
    }
    return cardData.consumos[selectedCard].map(c => ({ ...c, cardType: selectedCard })) || []
  }, [cardData, selectedCard])

  // Calculate totals by currency for Visa and Mastercard
  const visaTotals = useMemo(() => {
    if (!cardData) return { ars: 0, usd: 0 }
    const visaConsumos = cardData.consumos.visa
    const conversionRate = cardData.conversion_amount || 1
    
    const ars = visaConsumos
      .filter(c => !c.descripcion.toUpperCase().includes('USD'))
      .reduce((sum, c) => sum + c.importe, 0)
    
    // For USD consumos, convert back to USD by dividing by conversion_rate
    const usd = visaConsumos
      .filter(c => c.descripcion.toUpperCase().includes('USD'))
      .reduce((sum, c) => sum + (c.importe / conversionRate), 0)
    
    return { ars, usd }
  }, [cardData])

  const mastercardTotals = useMemo(() => {
    if (!cardData) return { ars: 0, usd: 0 }
    const mastercardConsumos = cardData.consumos.mastercard
    const conversionRate = cardData.conversion_amount || 1
    
    const ars = mastercardConsumos
      .filter(c => !c.descripcion.toUpperCase().includes('USD'))
      .reduce((sum, c) => sum + c.importe, 0)
    
    // For USD consumos, convert back to USD by dividing by conversion_rate
    const usd = mastercardConsumos
      .filter(c => c.descripcion.toUpperCase().includes('USD'))
      .reduce((sum, c) => sum + (c.importe / conversionRate), 0)
    
    return { ars, usd }
  }, [cardData])

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

  // Function to get color for each category
  const getCategoryColor = (categoria: string): string => {
    const catLower = categoria.toLowerCase()
    
    if (catLower.includes('mercadolibre')) return '#facc15' // Amarillo más vibrante
    if (catLower.includes('osde')) return '#2563eb' // Azul
    if (catLower.includes('personal')) return '#06b6d4' // Celeste
    if (catLower.includes('abl')) return '#16a34a' // Verde
    if (catLower.includes('delivery')) return 'url(#deliveryGradient)' // Gradiente naranja-rojo
    if (catLower.includes('transporte')) return '#8b5cf6' // Violeta
    if (catLower.includes('subscripciones') || catLower.includes('suscripciones')) {
      return 'url(#subscriptionGradient)' // Gradiente negro-rojo
    }
    
    // Color por defecto si no coincide
    return '#64748b'
  }


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
              <div className="p-4 sm:p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CreditCard className="h-5 w-5" />
                      <span className="font-medium">Total General</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-primary break-words">
                      {formatCurrency(cardData.total_visa + cardData.total_mastercard)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 text-sm border-t pt-4 sm:border-t-0 sm:pt-0">
                    <div className="flex flex-col sm:items-end gap-1 sm:flex-none">
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-muted-foreground text-xs sm:text-sm">Visa</span>
                        <span className="font-semibold text-xs sm:text-sm break-words">{formatCurrency(cardData.total_visa)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <span>ARS: {formatCurrency(visaTotals.ars)}</span>
                        {visaTotals.usd > 0 && (
                          <>
                            <span>•</span>
                            <span>USD: {formatCurrency(visaTotals.usd, 'USD')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1 sm:flex-none">
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-muted-foreground text-xs sm:text-sm">Mastercard</span>
                        <span className="font-semibold text-xs sm:text-sm break-words">{formatCurrency(cardData.total_mastercard)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <span>ARS: {formatCurrency(mastercardTotals.ars)}</span>
                        {mastercardTotals.usd > 0 && (
                          <>
                            <span>•</span>
                            <span>USD: {formatCurrency(mastercardTotals.usd, 'USD')}</span>
                          </>
                        )}
                      </div>
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
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="subscriptionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#000000" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                          <linearGradient id="deliveryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="60%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#b91c1c" />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          type="category" 
                          dataKey="categoria" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          type="number"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                          {chartData.map((item, index) => (
                            <Cell key={`cell-${index}`} fill={getCategoryColor(item.categoria)} />
                          ))}
                          <LabelList 
                            dataKey="total" 
                            position="top"
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Detalle de Consumos</h4>
                    {cardData.conversion_amount && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Dólar Tarjeta:</span>
                        <span className="font-semibold">
                          ${cardData.conversion_amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  <Tabs value={selectedCard} onValueChange={(v) => setSelectedCard(v as 'visa' | 'mastercard' | 'all')} className="flex-1 flex flex-col">
                    <TabsList className="mb-4">
                      <TabsTrigger value="visa" className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">VISA</span>
                      </TabsTrigger>
                      <TabsTrigger value="mastercard" className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400 font-bold">MASTERCARD</span>
                      </TabsTrigger>
                      <TabsTrigger value="all" className="flex items-center gap-2">
                        <span className="font-bold">TODAS</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value={selectedCard} className="mt-0 flex-1 flex flex-col min-h-0">
                      <div className="flex-1 min-h-[600px]">
                        <CardConsumosTable 
                          consumos={currentConsumos} 
                          showCardType={selectedCard === 'all'}
                          conversionAmount={cardData.conversion_amount}
                        />
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
