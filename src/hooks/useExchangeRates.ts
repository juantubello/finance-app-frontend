'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ExchangeRates {
  dolarBlue: number | null
  dolarTarjeta: number | null
  btcUsd: number | null
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
}

const REFRESH_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

export function useExchangeRates(): ExchangeRates {
  const [dolarBlue, setDolarBlue] = useState<number | null>(null)
  const [dolarTarjeta, setDolarTarjeta] = useState<number | null>(null)
  const [btcUsd, setBtcUsd] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch Dolar Blue from Bluelytics API
      const dolarResponse = await fetch('https://api.bluelytics.com.ar/v2/latest')
      if (dolarResponse.ok) {
        const dolarData = await dolarResponse.json()
        // value_sell is the selling price of USD in ARS
        setDolarBlue(dolarData.blue?.value_sell || null)
      }
    } catch (err) {
      console.error('Error fetching Dolar Blue:', err)
      // Don't set error, just keep previous value or null
    }

    try {
      // Fetch Dolar Tarjeta from BBVA via CriptoYa API
      const tarjetaResponse = await fetch('https://criptoya.com/api/bancostodos')
      if (tarjetaResponse.ok) {
        const tarjetaData = await tarjetaResponse.json()
        // Get BBVA ask price
        setDolarTarjeta(tarjetaData.bbva?.ask || null)
      }
    } catch (err) {
      console.error('Error fetching Dolar Tarjeta:', err)
      // Don't set error, just keep previous value or null
    }

    try {
      // Fetch Bitcoin price from CoinGecko API (free, no key needed)
      const btcResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      )
      if (btcResponse.ok) {
        const btcData = await btcResponse.json()
        setBtcUsd(btcData.bitcoin?.usd || null)
      }
    } catch (err) {
      console.error('Error fetching BTC price:', err)
      // Don't set error, just keep previous value or null
    }

    setLastUpdated(new Date())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Fetch immediately on mount
    fetchRates()

    // Set up interval to refresh every hour
    const interval = setInterval(fetchRates, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchRates])

  return {
    dolarBlue,
    dolarTarjeta,
    btcUsd,
    lastUpdated,
    isLoading,
    error,
  }
}

// User's BTC holdings
export const USER_BTC_HOLDINGS = 0.005197
