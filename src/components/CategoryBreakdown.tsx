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
        <div className="h-[200px] mb-4 flex-shrink-0 w-full overflow-x-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 11 }}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[200px]">
          {breakdown.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm">{item.category}</span>
              </div>
              <div className="text-right">
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
