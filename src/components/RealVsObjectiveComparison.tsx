'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/src/lib/format'
import type { Transaction } from '@/src/types/finance'
import { useBudgetObjectives } from '@/src/hooks/useBudgetObjectives'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface RealVsObjectiveComparisonProps {
  expenses: Transaction[]
  totalExpenses: number
  totalIncome?: number
}

// Mapeo de categorías reales a categorías objetivo
// Regulares = todo menos Inusuales y Ahorros
const mapCategoryToObjective = (category: string): 'Regulares' | 'Inusuales' | 'Ahorros' => {
  const lowerCategory = category.toLowerCase()
  
  // Primero verificar si es "Inusuales" o "Ahorros"
  if (lowerCategory.includes('bolud') || lowerCategory.includes('inusual')) {
    return 'Inusuales'
  }
  if (lowerCategory.includes('ahorro') || lowerCategory.includes('saving')) {
    return 'Ahorros'
  }
  
  // Todo lo demás va a "Regulares"
  return 'Regulares'
}

export function RealVsObjectiveComparison({ expenses, totalExpenses, totalIncome = 0 }: RealVsObjectiveComparisonProps) {
  const { objectives: budgetObjectives } = useBudgetObjectives()

  // Calcular gastos reales por categoría objetivo
  const realByCategory = useMemo(() => {
    const totals: Record<string, number> = {
      'Regulares': 0,
      'Inusuales': 0,
      'Ahorros': 0,
    }
    
    expenses.forEach(expense => {
      const objectiveCategory = mapCategoryToObjective(expense.category)
      totals[objectiveCategory] += expense.amount
    })
    
    return totals
  }, [expenses])

  // Usar ingresos reales del backend, o estimar si no están disponibles
  const income = totalIncome > 0 ? totalIncome : (totalExpenses > 0 ? totalExpenses * 1.5 : 0)
  
  // Calcular objetivos basados en porcentajes configurables del ingreso
  const objectives = useMemo(() => {
    return {
      'Regulares': income * (budgetObjectives.regulares / 100),
      'Inusuales': income * (budgetObjectives.inusuales / 100),
      'Ahorros': income * (budgetObjectives.ahorros / 100),
    }
  }, [income, budgetObjectives])

  // Preparar datos para el gráfico
  const chartData = [
    {
      categoria: 'Regulares',
      real: realByCategory.Regulares,
      objetivo: objectives.Regulares,
    },
    {
      categoria: 'Inusuales',
      real: realByCategory.Inusuales,
      objetivo: objectives.Inusuales,
    },
    {
      categoria: 'Ahorros',
      real: realByCategory.Ahorros,
      objetivo: objectives.Ahorros,
    },
  ]

  // Si no hay datos, mostrar mensaje
  if (totalExpenses === 0 && income === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No hay datos disponibles
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Gráfico pequeño */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="categoria" 
              tick={{ fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                return `$${value}`
              }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ fontSize: '12px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconSize={10}
            />
            <Bar dataKey="real" fill="#60a5fa" name="Gasto real" radius={[4, 4, 0, 0]} />
            <Bar dataKey="objetivo" fill="#f472b6" name="Objetivo" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen numérico compacto */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {chartData.map((item) => {
          const percentage = item.objetivo > 0 ? (item.real / item.objetivo) * 100 : 0
          const isOver = item.real > item.objetivo
          
          return (
            <div key={item.categoria} className="text-center p-2 rounded bg-muted/50">
              <div className="font-medium text-[10px] text-muted-foreground mb-1">
                {item.categoria}
              </div>
              <div className={`font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(item.real)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                / {formatCurrency(item.objetivo)}
              </div>
              <div className={`text-[10px] mt-1 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                {percentage.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
