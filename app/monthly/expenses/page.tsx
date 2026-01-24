'use client'

import { useMonthYear } from '@/src/contexts/MonthYearContext'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TransactionTable } from '@/src/components/TransactionTable'
import { CategoryBreakdown } from '@/src/components/CategoryBreakdown'
import { formatCurrency, getMonthName } from '@/src/lib/format'
import { USE_DEMO_DATA } from '@/src/lib/api'
import { getDemoMonthlyExpenses, getDemoCreditCard, EXPENSE_CATEGORIES } from '@/src/lib/dummy'
import { Receipt, CreditCard, CalendarClock, Banknote } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'

export default function ExpensesPage() {
  const { year, month } = useMonthYear()

  // TODO: Replace with actual API call when backend is ready
  const data = USE_DEMO_DATA 
    ? getDemoMonthlyExpenses(year, month)
    : null

  const tarjetaData = USE_DEMO_DATA
    ? getDemoCreditCard(year, month)
    : null

  if (!data || !tarjetaData) {
    return (
      <div>
        <Header title="Gastos Mensual" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Group credit card items by merchant for the chart
  const merchantTotals = tarjetaData.items.reduce((acc, item) => {
    acc[item.merchant] = (acc[item.merchant] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(merchantTotals)
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((a, b) => b.amount - a.amount)

  const COLORS = ['#16a34a', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#64748b']

  return (
    <div>
      <Header title="Gastos Mensual" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Period indicator */}
        <div className="text-sm text-muted-foreground">
          Gastos de {getMonthName(month)} {year}
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
              <Receipt className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
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
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>Detalle de Gastos</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <TransactionTable 
                  transactions={data.items} 
                  categories={EXPENSE_CATEGORIES}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Resumen Tarjeta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tarjeta Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CalendarClock className="h-4 w-4" />
                  Total Cuotas
                </div>
                <div className="text-xl font-bold">{formatCurrency(tarjetaData.totalCuotas)}</div>
                <p className="text-xs text-muted-foreground">
                  {tarjetaData.items.filter(i => i.isInstallment).length} items en cuotas
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Banknote className="h-4 w-4" />
                  Pagos Únicos
                </div>
                <div className="text-xl font-bold">{formatCurrency(tarjetaData.totalOneTime)}</div>
                <p className="text-xs text-muted-foreground">
                  {tarjetaData.items.filter(i => !i.isInstallment).length} servicios/compras
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CreditCard className="h-4 w-4" />
                  Total Tarjeta
                </div>
                <div className="text-xl font-bold text-primary">{formatCurrency(tarjetaData.total)}</div>
              </div>
            </div>

            {/* Chart and Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                <h4 className="text-sm font-medium mb-4">Gastos por Comercio</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="merchant" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--foreground)' }}
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-sm font-medium mb-4">Detalle de Items</h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {tarjetaData.items.map((item) => (
                    <div 
                      key={item.uuid} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.merchant}</span>
                          {item.isInstallment ? (
                            <Badge variant="secondary" className="text-xs">
                              {item.currentInstallment}/{item.totalInstallments}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Único
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-sm ml-4">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
