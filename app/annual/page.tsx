'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { LoadingPage } from '@/src/components/LoadingState'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { fetchAnnualSummary, fetchMonthlyExpenses, fetchCardAnnual } from '@/src/lib/api'
import type { AnnualSummary } from '@/src/types/finance'
import type { CardAnnualResponse } from '@/src/lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
  Customized,
} from 'recharts'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

export default function AnnualPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [data, setData] = useState<AnnualSummary | null>(null)
  const [cardAnnualData, setCardAnnualData] = useState<CardAnnualResponse | null>(null)
  const [unusualData, setUnusualData] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingCards, setLoadingCards] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Load annual summary
        const annualData = await fetchAnnualSummary(selectedYear)
        setData(annualData)

        // Load "Boludeces" expenses for each month
        const unusualMap = new Map<number, number>()
        const promises = Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
          try {
            const expenses = await fetchMonthlyExpenses(selectedYear, month, 'Boludeces')
            const total = expenses.items.reduce((sum, t) => sum + t.amount, 0)
            unusualMap.set(month, total)
          } catch (err) {
            console.error(`Error loading unusual expenses for month ${month}:`, err)
            unusualMap.set(month, 0)
          }
        })
        await Promise.all(promises)
        setUnusualData(unusualMap)
      } catch (err) {
        console.error('Error loading annual data:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los datos anuales')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedYear])

  useEffect(() => {
    const loadCardData = async () => {
      setLoadingCards(true)
      try {
        const cardData = await fetchCardAnnual(selectedYear)
        setCardAnnualData(cardData)
      } catch (err) {
        console.error('Error loading card annual data:', err)
      } finally {
        setLoadingCards(false)
      }
    }

    loadCardData()
  }, [selectedYear])

  if (loading) {
    return (
      <div>
        <Header title="Vista Anual" showMonthYear={false} />
        <LoadingPage />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Vista Anual" showMonthYear={false} />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'No se pudieron cargar los datos anuales'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const chartData = data.months.map((m) => ({
    name: m.monthName,
    Ingresos: m.income,
    Egresos: m.expenses,
    Ahorros: m.savings,
  }))

  // Prepare card annual chart data with month-to-month differences
  const cardChartData = cardAnnualData?.months.map((m, index) => {
    const monthName = getMonthName(m.month)
    const previousMonthTotal = index > 0 ? cardAnnualData.months[index - 1].total : null
    const difference = previousMonthTotal !== null ? m.total - previousMonthTotal : null
    const isSavings = difference !== null ? difference < 0 : null
    const absDifference = difference !== null ? Math.abs(difference) : null
    const differenceLabel = difference !== null 
      ? (isSavings 
          ? `+ ${formatCurrency(absDifference)}`
          : `- ${formatCurrency(absDifference)}`)
      : ''
    
    // Calculate percentage change
    const percentageChange = previousMonthTotal !== null && previousMonthTotal !== 0
      ? ((difference! / previousMonthTotal) * 100)
      : null
    
    return {
      name: monthName,
      Visa: m.total_visa,
      Mastercard: m.total_mastercard,
      Total: m.total,
      difference,
      isSavings,
      differenceLabel,
      percentageChange,
      previousMonthTotal,
    }
  }) || []

  // Calculate trend statistics
  const trendStats = (() => {
    const differences = cardChartData
      .map(d => d.difference)
      .filter((d): d is number => d !== null)
    
    if (differences.length === 0) {
      return {
        averageDifference: 0,
        averagePercentageChange: 0,
        trend: 'neutral' as const,
        trendDescription: 'Sin datos suficientes',
      }
    }
    
    const averageDifference = differences.reduce((sum, d) => sum + d, 0) / differences.length
    const percentageChanges = cardChartData
      .map(d => d.percentageChange)
      .filter((p): p is number => p !== null)
    const averagePercentageChange = percentageChanges.length > 0
      ? percentageChanges.reduce((sum, p) => sum + p, 0) / percentageChanges.length
      : 0
    
    // Determine trend: if average is negative, it's savings trend (spending less)
    // if average is positive, it's spending more trend
    const trend = averageDifference < 0 ? 'savings' : averageDifference > 0 ? 'spending' : 'neutral'
    const trendDescription = trend === 'savings'
      ? 'Tendencia a ahorrar'
      : trend === 'spending'
      ? 'Tendencia a gastar más'
      : 'Tendencia estable'
    
    return {
      averageDifference,
      averagePercentageChange,
      trend,
      trendDescription,
    }
  })()

  return (
    <div>
      <Header title="Vista Anual" showMonthYear={false} />
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Año:</span>
          <Select 
            value={String(selectedYear)} 
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.totals.income)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data.totals.expenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Ahorros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.totals.savings)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Balance Anual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.totals.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Annual Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Mensual {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ahorros" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card Annual Evolution Chart */}
        {!loadingCards && cardAnnualData && cardChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Evolución de Gastos en Tarjetas {selectedYear}</CardTitle>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <span>Total Anual: <span className="font-semibold">{formatCurrency(cardAnnualData.total)}</span></span>
                <span className="hidden sm:inline">{' | '}</span>
                <span>Visa: <span className="font-semibold text-blue-600">{formatCurrency(cardAnnualData.total_visa)}</span></span>
                <span className="hidden sm:inline">{' | '}</span>
                <span>Mastercard: <span className="font-semibold text-red-600">{formatCurrency(cardAnnualData.total_mastercard)}</span></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cardChartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Visa" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Mastercard" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Total" 
                      stroke="#16a34a" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    >
                      <LabelList
                        dataKey="differenceLabel"
                        position="top"
                        formatter={(value: string, entry: any, index: number) => {
                          // Skip first month (index 0)
                          if (index === 0 || !value || value === '') return ''
                          return value
                        }}
                        content={(props: any) => {
                          if (!props || !props.payload) return null
                          
                          const { x, y, value, payload } = props
                          const index = payload.index
                          
                          // Skip first month and null/empty values
                          if (index === 0 || !value || value === '' || value === null) return null
                          
                          const entry = cardChartData[index]
                          if (!entry || entry.difference === null) return null
                          
                          const isSavings = entry.isSavings
                          
                          return (
                            <text
                              x={x}
                              y={y - 25}
                              fill={isSavings ? '#16a34a' : '#dc2626'}
                              fontSize={11}
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {value}
                            </text>
                          )
                        }}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Month-to-month differences table and trend analysis */}
              <div className="mt-6 space-y-4">
                {/* Trend Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs sm:text-sm text-muted-foreground">Promedio Mensual</div>
                      <div className={`text-base sm:text-lg font-semibold mt-1 break-words ${
                        trendStats.averageDifference < 0 
                          ? 'text-green-600' 
                          : trendStats.averageDifference > 0 
                          ? 'text-red-600' 
                          : 'text-muted-foreground'
                      }`}>
                        {trendStats.averageDifference < 0 
                          ? `+${formatCurrency(Math.abs(trendStats.averageDifference))}`
                          : trendStats.averageDifference > 0
                          ? `-${formatCurrency(trendStats.averageDifference)}`
                          : formatCurrency(0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {trendStats.averageDifference < 0 ? 'Ahorro promedio' : trendStats.averageDifference > 0 ? 'Gasto adicional promedio' : 'Sin variación'}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs sm:text-sm text-muted-foreground">Cambio Porcentual Promedio</div>
                      <div className={`text-base sm:text-lg font-semibold mt-1 ${
                        trendStats.averagePercentageChange < 0 
                          ? 'text-green-600' 
                          : trendStats.averagePercentageChange > 0 
                          ? 'text-red-600' 
                          : 'text-muted-foreground'
                      }`}>
                        {trendStats.averagePercentageChange < 0 
                          ? `+${Math.abs(trendStats.averagePercentageChange).toFixed(1)}%`
                          : trendStats.averagePercentageChange > 0
                          ? `-${trendStats.averagePercentageChange.toFixed(1)}%`
                          : '0%'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {trendStats.averagePercentageChange < 0 ? 'Reducción promedio' : trendStats.averagePercentageChange > 0 ? 'Incremento promedio' : 'Sin variación'}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs sm:text-sm text-muted-foreground">Tendencia</div>
                      <div className={`text-base sm:text-lg font-semibold mt-1 break-words ${
                        trendStats.trend === 'savings'
                          ? 'text-green-600'
                          : trendStats.trend === 'spending'
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }`}>
                        {trendStats.trendDescription}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Basado en {cardChartData.filter(d => d.difference !== null).length} comparaciones
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Month-to-month differences timeline */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[80px]">Mes</TableHead>
                          <TableHead className="text-right min-w-[120px]">Gasto del Mes</TableHead>
                          <TableHead className="text-right min-w-[120px]">Diferencia</TableHead>
                          <TableHead className="text-right min-w-[100px]">% Cambio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cardChartData.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{entry.name}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(entry.Total)}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${
                              entry.difference === null
                                ? 'text-muted-foreground'
                                : entry.isSavings
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {entry.difference === null 
                                ? '-' 
                                : entry.isSavings
                                ? `+${formatCurrency(Math.abs(entry.difference))}`
                                : `-${formatCurrency(entry.difference)}`}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${
                              entry.percentageChange === null
                                ? 'text-muted-foreground'
                                : entry.percentageChange < 0
                                ? 'text-green-600'
                                : entry.percentageChange > 0
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                            }`}>
                              {entry.percentageChange === null 
                                ? '-' 
                                : entry.percentageChange < 0
                                ? `+${Math.abs(entry.percentageChange).toFixed(1)}%`
                                : entry.percentageChange > 0
                                ? `-${entry.percentageChange.toFixed(1)}%`
                                : '0%'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inusuales Section */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Inusuales (Boludeces)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.months.map((month) => {
                    const unusualAmount = unusualData.get(month.month) || 0
                    return (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.monthName}</TableCell>
                        <TableCell className="text-right text-orange-600 font-mono">
                          {formatCurrency(unusualAmount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right text-orange-600 font-mono font-bold">
                      {formatCurrency(
                        Array.from(unusualData.values()).reduce((sum, val) => sum + val, 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Egresos</TableHead>
                    <TableHead className="text-right">Ahorros</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.months.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.monthName}</TableCell>
                      <TableCell className="text-right text-green-600 font-mono">
                        {formatCurrency(month.income)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-mono">
                        {formatCurrency(month.expenses)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-mono">
                        {formatCurrency(month.savings)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right text-green-600 font-mono font-bold">
                      {formatCurrency(data.totals.income)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-mono font-bold">
                      {formatCurrency(data.totals.expenses)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 font-mono font-bold">
                      {formatCurrency(data.totals.savings)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${data.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.totals.balance)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
