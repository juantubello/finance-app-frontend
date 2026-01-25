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

  // Prepare card annual chart data
  const cardChartData = cardAnnualData?.months.map((m) => {
    const monthName = getMonthName(m.month)
    return {
      name: monthName,
      Visa: m.total_visa,
      Mastercard: m.total_mastercard,
      Total: m.total,
    }
  }) || []

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
              <CardTitle>Evolución de Gastos en Tarjetas {selectedYear}</CardTitle>
              <div className="text-sm text-muted-foreground mt-2">
                Total Anual: <span className="font-semibold">{formatCurrency(cardAnnualData.total)}</span>
                {' | '}
                Visa: <span className="font-semibold text-blue-600">{formatCurrency(cardAnnualData.total_visa)}</span>
                {' | '}
                Mastercard: <span className="font-semibold text-red-600">{formatCurrency(cardAnnualData.total_mastercard)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cardChartData}>
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
                    />
                  </LineChart>
                </ResponsiveContainer>
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
