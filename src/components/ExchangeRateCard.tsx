'use client'

import { useExchangeRates, USER_BTC_HOLDINGS } from '@/src/hooks/useExchangeRates'
import { DollarSign, Bitcoin, RefreshCw } from 'lucide-react'

interface ExchangeRateCardProps {
  showBtc?: boolean
}

export function ExchangeRateCard({ showBtc = false }: ExchangeRateCardProps) {
  const { dolarBlue, btcUsd, isLoading } = useExchangeRates()

  const btcValueUsd = btcUsd && USER_BTC_HOLDINGS ? btcUsd * USER_BTC_HOLDINGS : null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm px-3 py-2 bg-muted/50 rounded-lg border w-fit">
      {/* Dolar Blue */}
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-green-600" />
        <span className="text-muted-foreground">Blue:</span>
        {isLoading ? (
          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <span className="font-semibold">
            {dolarBlue ? `$${dolarBlue.toLocaleString('es-AR')}` : '-'}
          </span>
        )}
      </div>

      {/* Bitcoin */}
      {showBtc && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <div className="flex items-center gap-1.5">
            <Bitcoin className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-muted-foreground">BTC:</span>
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="font-semibold">
                {btcUsd ? `US$${btcUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}
              </span>
            )}
            {btcValueUsd && (
              <span className="text-xs text-muted-foreground">
                ({USER_BTC_HOLDINGS} = US${btcValueUsd.toFixed(2)})
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
