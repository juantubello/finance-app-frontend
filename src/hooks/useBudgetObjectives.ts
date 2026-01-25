'use client'

import { useState, useEffect } from 'react'

export interface BudgetObjectives {
  regulares: number // porcentaje (0-100)
  inusuales: number // porcentaje (0-100)
  ahorros: number   // porcentaje (0-100)
}

const DEFAULT_OBJECTIVES: BudgetObjectives = {
  regulares: 50,
  inusuales: 30,
  ahorros: 20,
}

const STORAGE_KEY = 'budget_objectives'

export function useBudgetObjectives() {
  const [objectives, setObjectives] = useState<BudgetObjectives>(DEFAULT_OBJECTIVES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar desde localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as BudgetObjectives
        // Validar que sumen 100%
        const total = parsed.regulares + parsed.inusuales + parsed.ahorros
        if (total === 100 && 
            parsed.regulares >= 0 && parsed.regulares <= 100 &&
            parsed.inusuales >= 0 && parsed.inusuales <= 100 &&
            parsed.ahorros >= 0 && parsed.ahorros <= 100) {
          setObjectives(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading budget objectives:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateObjectives = (newObjectives: BudgetObjectives) => {
    // Validar que sumen 100%
    const total = newObjectives.regulares + newObjectives.inusuales + newObjectives.ahorros
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Los porcentajes deben sumar 100%')
    }

    // Validar rangos
    if (newObjectives.regulares < 0 || newObjectives.regulares > 100 ||
        newObjectives.inusuales < 0 || newObjectives.inusuales > 100 ||
        newObjectives.ahorros < 0 || newObjectives.ahorros > 100) {
      throw new Error('Los porcentajes deben estar entre 0% y 100%')
    }

    setObjectives(newObjectives)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newObjectives))
  }

  return {
    objectives,
    updateObjectives,
    isLoading,
  }
}
