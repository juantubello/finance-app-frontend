'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchCedearSpy } from '@/src/lib/api'
import type { CedearSpyResponse } from '@/src/lib/api'

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

export function useCedearSpy() {
  const [cedearData, setCedearData] = useState<CedearSpyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCedearPrice = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchCedearSpy()
      setCedearData(data)
    } catch (err) {
      console.error('Error fetching CEDEAR SPY500 price:', err)
      setError(err instanceof Error ? err.message : 'Error al obtener precio de CEDEAR')
      // Don't clear previous data on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch immediately on mount
    fetchCedearPrice()

    // Set up interval to refresh every 5 minutes
    const interval = setInterval(fetchCedearPrice, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchCedearPrice])

  return {
    cedearData,
    isLoading,
    error,
    refetch: fetchCedearPrice,
  }
}
