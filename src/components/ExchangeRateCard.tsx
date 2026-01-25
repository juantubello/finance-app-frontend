'use client'

import { useExchangeRates } from '@/src/hooks/useExchangeRates'
import { useCedearSpy } from '@/src/hooks/useCedearSpy'
import { DollarSign, Bitcoin, RefreshCw, TrendingUp } from 'lucide-react'

interface ExchangeRateCardProps {
  showBtc?: boolean
}

export function ExchangeRateCard({ showBtc = false }: ExchangeRateCardProps) {
  const { dolarBlue, btcUsd, isLoading: isLoadingRates } = useExchangeRates()
  const { cedearData, isLoading: isLoadingCedear } = useCedearSpy()

  // Valores de referencia (sin cálculos personales)
  const cedearPrice = cedearData?.lastPrice || null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm px-3 py-2 bg-muted/50 rounded-lg border w-fit">
      {/* Dolar Blue - Valor de referencia */}
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-green-600" />
        <span className="text-muted-foreground">Blue:</span>
        {isLoadingRates ? (
          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <span className="font-semibold">
            {dolarBlue ? `$${dolarBlue.toLocaleString('es-AR')}` : '-'}
          </span>
        )}
      </div>

      {/* Bitcoin - Valor de referencia (1 BTC = US$X) */}
      {showBtc && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <div className="flex items-center gap-1.5">
            <Bitcoin className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-muted-foreground">BTC:</span>
            {isLoadingRates ? (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="font-semibold">
                {btcUsd ? `US$${btcUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}
              </span>
            )}
          </div>
        </>
      )}

      {/* CEDEAR SPY500 - Valor de referencia (1 CEDEAR = $X) */}
      {cedearPrice && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-muted-foreground">CEDEAR:</span>
            {isLoadingCedear ? (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="font-semibold">
                ${cedearPrice.toLocaleString('es-AR')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
