'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExchangeRateCard } from '@/src/components/ExchangeRateCard'
import { PatrimonioForm } from '@/src/components/PatrimonioForm'
import { LoadingPage } from '@/src/components/LoadingState'
import { useExchangeRates } from '@/src/hooks/useExchangeRates'
import { useCedearSpy } from '@/src/hooks/useCedearSpy'
import { formatCurrency, formatDate } from '@/src/lib/format'
import { fetchPatrimonio, fetchCurrentLiquidity } from '@/src/lib/api'
import type { PatrimonioResponse } from '@/src/lib/api'
import { Wallet, Bitcoin, TrendingUp, DollarSign } from 'lucide-react'

export default function NetworthPage() {
  const { btcUsd, dolarBlue } = useExchangeRates()
  const { cedearData } = useCedearSpy()
  const [patrimonio, setPatrimonio] = useState<PatrimonioResponse | null>(null)
  const [liquidity, setLiquidity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [patrimonioData, liquidityData] = await Promise.all([
        fetchPatrimonio(),
        fetchCurrentLiquidity(),
      ])
      setPatrimonio(patrimonioData)
      setLiquidity(liquidityData.current)
    } catch (err) {
      console.error('Error loading patrimonio:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el patrimonio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div>
        <Header title="Patrimonio" showMonthYear={false} />
        <LoadingPage />
      </div>
    )
  }

  if (error || !patrimonio) {
    return (
      <div>
        <Header title="Patrimonio" showMonthYear={false} />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'No se pudieron cargar los datos del patrimonio'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate values with null checks
  const bitcoinQuantity = patrimonio.bitcoin?.quantity || 0
  const btcValueUsd = btcUsd ? btcUsd * bitcoinQuantity : 0
  const btcValueArs = btcUsd && dolarBlue ? btcValueUsd * dolarBlue : 0
  
  // CEDEAR SPY500 - usar precio de la API si está disponible
  const cedearQuantity = patrimonio.cedear?.quantity || 0
  const cedearPriceArs = cedearData?.lastPrice || null
  const cedearValueArs = cedearQuantity > 0 && cedearPriceArs ? cedearQuantity * cedearPriceArs : 0
  const cedearValueUsd = cedearValueArs > 0 && dolarBlue ? cedearValueArs / dolarBlue : 0

  // USD Físico
  const usdFisicoTotal = patrimonio.usd_fisico?.total || 0
  const usdFisicoValueArs = dolarBlue ? usdFisicoTotal * dolarBlue : 0

  // Patrimonio USD total
  const patrimonioUsdArray = patrimonio.patrimonio_usd || []
  const patrimonioUsdTotal = patrimonioUsdArray.reduce((sum, item) => sum + (item.value_usd || 0), 0)
  const patrimonioUsdTotalArs = dolarBlue ? patrimonioUsdTotal * dolarBlue : 0

  // Liquidez disponible
  const disponibleArs = liquidity || 0
  const disponibleUsd = dolarBlue ? disponibleArs / dolarBlue : 0

  // Calcular totales
  // Total en ARS: sumar todos los activos convertidos a ARS
  const totalArs = disponibleArs + 
                   btcValueArs + 
                   cedearValueArs + 
                   usdFisicoValueArs + 
                   patrimonioUsdTotalArs

  // Total en USD: usar dólar blue para convertir
  const totalUsd = dolarBlue ? totalArs / dolarBlue : 0

  return (
    <div>
      <Header title="Patrimonio" showMonthYear={false} />
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Resumen de patrimonio
          </div>
          <PatrimonioForm onSuccess={loadData} />
        </div>

        {/* Cotizaciones */}
        <ExchangeRateCard showBtc={true} />

        {/* Total Patrimonio */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Patrimonio</span>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(totalArs)}
                  </div>
                  <div className="text-xs text-muted-foreground">ARS</div>
                </div>
                <span className="text-muted-foreground/50 text-sm">=</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(totalUsd, 'USD')}
                  </div>
                  <div className="text-xs text-muted-foreground">USD</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patrimonio List */}
        <Card>
          <CardHeader>
            <CardTitle>Patrimonio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Disponible */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-medium">Disponible</div>
                    <div className="text-sm text-muted-foreground">ARS</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatCurrency(disponibleArs)}</div>
                  {dolarBlue && (
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(disponibleUsd, 'USD')}
                    </div>
                  )}
                </div>
              </div>

              {/* Bitcoin Holdings */}
              {bitcoinQuantity > 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium">Bitcoin</div>
                      <div className="text-sm text-muted-foreground">
                        {bitcoinQuantity} BTC
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {btcUsd ? formatCurrency(btcValueUsd, 'USD') : '-'}
                    </div>
                    {dolarBlue && (
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(btcValueArs)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nominales SPY500 CEDEAR */}
              {cedearQuantity > 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Nominales SPY500 CEDEAR</div>
                      <div className="text-sm text-muted-foreground">
                        {cedearQuantity} CEDEARs
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {cedearValueArs > 0 ? formatCurrency(cedearValueArs) : '-'}
                    </div>
                    {cedearValueUsd > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(cedearValueUsd, 'USD')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ahorros en USD */}
              {usdFisicoTotal > 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Ahorros en USD</div>
                      <div className="text-sm text-muted-foreground">
                        USD Físico
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(usdFisicoTotal, 'USD')}
                    </div>
                    {dolarBlue && (
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(usdFisicoValueArs)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patrimonio en USD */}
              {patrimonioUsdTotal > 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Patrimonio en USD</div>
                      <div className="text-sm text-muted-foreground">
                        {patrimonioUsdArray.length} items
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(patrimonioUsdTotal, 'USD')}
                    </div>
                    {dolarBlue && (
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(patrimonioUsdTotalArs)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detalle de Patrimonio USD */}
              {patrimonioUsdArray.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-3">Detalle Patrimonio USD:</div>
                  <div className="space-y-2">
                    {patrimonioUsdArray.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{item.description}</span>
                        <span className="text-sm font-mono">
                          {formatCurrency(item.value_usd, 'USD')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
