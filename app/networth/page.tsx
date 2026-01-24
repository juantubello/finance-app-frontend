'use client'

import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExchangeRateCard } from '@/src/components/ExchangeRateCard'
import { useExchangeRates, USER_BTC_HOLDINGS } from '@/src/hooks/useExchangeRates'
import { formatCurrency, formatDate } from '@/src/lib/format'
import { USE_DEMO_DATA } from '@/src/lib/api'
import { getDemoNetWorth } from '@/src/lib/dummy'
import { TrendingUp, TrendingDown, Scale } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const ASSET_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']
const DEBT_COLORS = ['#dc2626', '#ef4444', '#f87171']

export default function NetworthPage() {
  const { btcUsd, dolarBlue } = useExchangeRates()

  // TODO: Replace with actual API call when backend is ready
  const baseData = USE_DEMO_DATA 
    ? getDemoNetWorth()
    : null

  if (!baseData) {
    return (
      <div>
        <Header title="Patrimonio" showMonthYear={false} />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Calculate BTC value in ARS using live prices
  const btcValueUsd = btcUsd ? btcUsd * USER_BTC_HOLDINGS : 0
  const btcValueArs = btcValueUsd && dolarBlue ? btcValueUsd * dolarBlue : 0

  // Update assets to show BTC with live price instead of generic crypto
  const updatedAssets = baseData.assets.map(asset => {
    if (asset.name === 'Crypto (BTC/ETH)') {
      return {
        ...asset,
        name: `Bitcoin (${USER_BTC_HOLDINGS} BTC)`,
        value: btcValueArs || asset.value, // Use live value or fallback
      }
    }
    return asset
  })

  const data = {
    ...baseData,
    assets: updatedAssets,
  }

  // Recalculate totals with updated BTC value
  const totalAssets = updatedAssets.reduce((sum, a) => sum + a.value, 0)
  const totalDebts = data.debts.reduce((sum, d) => sum + d.value, 0)
  const netWorth = totalAssets - totalDebts

  // Use updatedAssets for chart to ensure BTC value is correct
  const assetsChartData = updatedAssets.map((a) => ({
    name: a.name,
    value: a.value,
  }))

  const debtsChartData = data.debts.map((d) => ({
    name: d.name,
    value: d.value,
  }))

  return (
    <div>
      <Header title="Patrimonio" showMonthYear={false} />
      <div className="p-4 md:p-6 space-y-6">
        {/* Last updated */}
        <div className="text-sm text-muted-foreground">
          Actualizado al {formatDate(data.date)}
        </div>

        {/* Cotizaciones - compact inline */}
        <ExchangeRateCard showBtc={true} />

        {/* Main Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAssets)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.assets.length} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deudas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDebts)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.debts.length} deudas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patrimonio Neto</CardTitle>
              <Scale className="h-4 w-4 text-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netWorth)}
              </div>
              <p className="text-xs text-muted-foreground">
                Activos - Deudas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {assetsChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.assets.map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{asset.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {asset.category}
                      </Badge>
                    </div>
                    <span className="text-sm font-mono text-green-600">
                      {formatCurrency(asset.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Debts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Deudas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={debtsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {debtsChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DEBT_COLORS[index % DEBT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.debts.map((debt) => (
                  <div key={debt.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{debt.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {debt.category}
                      </Badge>
                    </div>
                    <span className="text-sm font-mono text-red-600">
                      {formatCurrency(debt.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.breakdown.map((item) => (
                <div key={item.category} className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{item.category}</div>
                  <div className="text-xl font-bold mt-1">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
