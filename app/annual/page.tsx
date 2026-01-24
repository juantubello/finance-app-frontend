'use client'

import { useState } from 'react'
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
import { formatCurrency } from '@/src/lib/format'
import { USE_DEMO_DATA } from '@/src/lib/api'
import { getDemoAnnualSummary } from '@/src/lib/dummy'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

export default function AnnualPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // TODO: Replace with actual API call when backend is ready
  // import { fetchAnnualSummary } from '@/src/lib/api'
  // const data = await fetchAnnualSummary(selectedYear)
  
  // For now, use demo data
  const data = USE_DEMO_DATA 
    ? getDemoAnnualSummary(selectedYear)
    : null

  if (!data) {
    return (
      <div>
        <Header title="Vista Anual" showMonthYear={false} />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">Cargando...</p>
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

  return (
    <div>
      <Header title="Vista Anual" showMonthYear={false} />
      <div className="p-4 md:p-6 space-y-6">
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
