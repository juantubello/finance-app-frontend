'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CategoryBreakdown as CategoryBreakdownType } from '@/src/types/finance'
import { formatCurrency, formatPercentage } from '@/src/lib/format'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface CategoryBreakdownProps {
  breakdown: CategoryBreakdownType[]
  title?: string
}

export function CategoryBreakdown({ breakdown, title = 'Por Categoría' }: CategoryBreakdownProps) {
  const chartData = breakdown.slice(0, 8).map((item) => ({
    name: item.category,
    value: item.amount,
  }))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Chart - Hidden on mobile, visible on desktop */}
        <div className="hidden md:block h-[200px] mb-4 flex-shrink-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <XAxis 
                type="number" 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                  return `$${value}`
                }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 10 }}
                className="text-xs"
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
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* List - Always visible, takes more space on mobile */}
        <div className={`space-y-2 flex-1 overflow-y-auto ${chartData.length > 0 ? 'md:max-h-[200px]' : ''}`}>
          {breakdown.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm truncate">{item.category}</span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-sm font-medium">{formatCurrency(item.amount)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPercentage(item.percentage)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
