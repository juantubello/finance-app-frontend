'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/src/components/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { syncDB, syncResumes, adjustLiquidity } from '@/src/lib/api'
import { RefreshCw, CheckCircle2, XCircle, Loader2, DollarSign, Database, CreditCard, Wallet, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { useBudgetObjectives } from '@/src/hooks/useBudgetObjectives'

export default function SyncPage() {
  const [inicio, setInicio] = useState('A')
  const [fin, setFin] = useState('G')
  const [loading, setLoading] = useState(false)
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [loadingLiquidity, setLoadingLiquidity] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [resultResumes, setResultResumes] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [resultLiquidity, setResultLiquidity] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  
  // Liquidity adjustment form state
  const [liquidityAmount, setLiquidityAmount] = useState('')
  const [liquidityDescription, setLiquidityDescription] = useState('')
  const [liquidityDate, setLiquidityDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })
  
  // Budget objectives
  const { objectives: budgetObjectives, updateObjectives } = useBudgetObjectives()
  const [regularesPercent, setRegularesPercent] = useState(String(budgetObjectives.regulares))
  const [inusualesPercent, setInusualesPercent] = useState(String(budgetObjectives.inusuales))
  const [ahorrosPercent, setAhorrosPercent] = useState(String(budgetObjectives.ahorros))
  const [loadingObjectives, setLoadingObjectives] = useState(false)
  
  const { toast } = useToast()

  // Sincronizar estados locales con objetivos cuando cambian
  useEffect(() => {
    setRegularesPercent(String(budgetObjectives.regulares))
    setInusualesPercent(String(budgetObjectives.inusuales))
    setAhorrosPercent(String(budgetObjectives.ahorros))
  }, [budgetObjectives])

  const handleSync = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await syncDB(inicio, fin)
      setResult(response)
      
      if (response.success) {
        toast({
          title: 'Sincronización exitosa',
          description: response.message || 'Los datos se han sincronizado correctamente',
        })
      } else {
        toast({
          title: 'Error en la sincronización',
          description: response.error || response.message || 'Ocurrió un error al sincronizar',
          variant: 'destructive',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setResult({
        success: false,
        error: errorMessage,
      })
      toast({
        title: 'Error en la sincronización',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncResumes = async () => {
    setLoadingResumes(true)
    setResultResumes(null)
    
    try {
      const response = await syncResumes()
      setResultResumes(response)
      
      if (response.success) {
        toast({
          title: 'Sincronización de resúmenes exitosa',
          description: response.message || 'Los resúmenes se han sincronizado correctamente',
        })
      } else {
        toast({
          title: 'Error en la sincronización',
          description: response.error || response.message || 'Ocurrió un error al sincronizar',
          variant: 'destructive',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setResultResumes({
        success: false,
        error: errorMessage,
      })
      toast({
        title: 'Error en la sincronización',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoadingResumes(false)
    }
  }

  const handleAdjustLiquidity = async () => {
    if (!liquidityAmount || !liquidityDescription) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa el monto y la descripción',
        variant: 'destructive',
      })
      return
    }

    setLoadingLiquidity(true)
    setResultLiquidity(null)
    
    try {
      // Convert date to ISO string with timezone
      const dateObj = new Date(liquidityDate)
      const timezoneOffset = -dateObj.getTimezoneOffset()
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
      const offsetMinutes = Math.abs(timezoneOffset) % 60
      const offsetSign = timezoneOffset >= 0 ? '+' : '-'
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
      
      const isoDateTime = `${dateObj.toISOString().slice(0, 19)}${offsetString}`
      
      const response = await adjustLiquidity({
        datetime: isoDateTime,
        currency: 'ARS',
        amount: parseFloat(liquidityAmount),
        description: liquidityDescription,
      })
      
      // Si la respuesta es exitosa (no tiene error explícito), consideramos éxito
      const isSuccess = response.success !== false && !response.error
      
      const result = {
        success: isSuccess,
        message: response.message,
        error: response.error,
      }
      
      setResultLiquidity(result)
      
      if (isSuccess) {
        toast({
          title: 'Ajuste de liquidez exitoso',
          description: response.message || 'La liquidez se ha ajustado correctamente',
        })
        // Reset form
        setLiquidityAmount('')
        setLiquidityDescription('')
      } else {
        toast({
          title: 'Error en el ajuste',
          description: response.error || response.message || 'Ocurrió un error al ajustar la liquidez',
          variant: 'destructive',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setResultLiquidity({
        success: false,
        error: errorMessage,
      })
      toast({
        title: 'Error en el ajuste',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoadingLiquidity(false)
    }
  }

  return (
    <div>
      <Header title="Sincronización de Datos" showMonthYear={false} />
      <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Sincronizar Base de Datos - Azul */}
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Sincronizar Base de Datos
                </CardTitle>
                <CardDescription>
                  Sincroniza los datos desde el rango especificado. Por defecto sincroniza desde A hasta G.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicio">Inicio</Label>
                  <Input
                    id="inicio"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    placeholder="A"
                    maxLength={1}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fin">Fin</Label>
                  <Input
                    id="fin"
                    value={fin}
                    onChange={(e) => setFin(e.target.value)}
                    placeholder="G"
                    maxLength={1}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Sync Button */}
              <Button
                onClick={handleSync}
                disabled={loading || !inicio || !fin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar
                  </>
                )}
              </Button>

              {/* Result */}
              {result && (
                <div
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          result.success
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {result.success ? 'Sincronización exitosa' : 'Error en la sincronización'}
                      </p>
                      {(result.message || result.error) && (
                        <p
                          className={`text-sm mt-1 ${
                            result.success
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {result.message || result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Card 2: Sincronizar Resúmenes - Púrpura */}
            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Sincronizar Resúmenes
                </CardTitle>
                <CardDescription>
                  Sincroniza los resúmenes de tarjetas de crédito.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Button */}
              <Button
                onClick={handleSyncResumes}
                disabled={loadingResumes}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {loadingResumes ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar Resúmenes
                  </>
                )}
              </Button>

              {/* Result */}
              {resultResumes && (
                <div
                  className={`p-4 rounded-lg border ${
                    resultResumes.success
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {resultResumes.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          resultResumes.success
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {resultResumes.success ? 'Sincronización exitosa' : 'Error en la sincronización'}
                      </p>
                      {(resultResumes.message || resultResumes.error) && (
                        <p
                          className={`text-sm mt-1 ${
                            resultResumes.success
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {resultResumes.message || resultResumes.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Card 3: Ajustar Liquidez - Verde/Esmeralda */}
            <Card className="lg:col-span-2 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Ajustar Liquidez
                </CardTitle>
                <CardDescription>
                  Ajusta el balance de apertura de liquidez. Puedes usar valores positivos o negativos para correcciones.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="liquidity-date">Fecha y Hora</Label>
                    <Input
                      id="liquidity-date"
                      type="datetime-local"
                      value={liquidityDate}
                      onChange={(e) => setLiquidityDate(e.target.value)}
                      disabled={loadingLiquidity}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liquidity-amount">Monto (ARS)</Label>
                    <Input
                      id="liquidity-amount"
                      type="number"
                      step="0.01"
                      value={liquidityAmount}
                      onChange={(e) => setLiquidityAmount(e.target.value)}
                      placeholder="Ej: -5000.50"
                      disabled={loadingLiquidity}
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa valores negativos para correcciones hacia abajo
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="liquidity-description">Descripción</Label>
                  <Textarea
                    id="liquidity-description"
                    value={liquidityDescription}
                    onChange={(e) => setLiquidityDescription(e.target.value)}
                    placeholder="Ej: Corrección por error de cálculo"
                    disabled={loadingLiquidity}
                    rows={3}
                  />
                </div>
              </div>

              {/* Adjust Button */}
              <Button
                onClick={handleAdjustLiquidity}
                disabled={loadingLiquidity || !liquidityAmount || !liquidityDescription}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
              >
                {loadingLiquidity ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajustando...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Ajustar Liquidez
                  </>
                )}
              </Button>

              {/* Result */}
              {resultLiquidity && (
                <div
                  className={`p-4 rounded-lg border ${
                    resultLiquidity.success
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {resultLiquidity.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          resultLiquidity.success
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {resultLiquidity.success ? 'Ajuste exitoso' : 'Error en el ajuste'}
                      </p>
                      {(resultLiquidity.message || resultLiquidity.error) && (
                        <p
                          className={`text-sm mt-1 ${
                            resultLiquidity.success
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {resultLiquidity.message || resultLiquidity.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Card 4: Configurar Objetivos de Presupuesto - Naranja */}
            <Card className="lg:col-span-2 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                    <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Configurar Objetivos de Presupuesto
                </CardTitle>
                <CardDescription>
                  Define los porcentajes de distribución de tus ingresos mensuales. Los porcentajes deben sumar 100%.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regulares-percent">Regulares (%)</Label>
                    <Input
                      id="regulares-percent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={regularesPercent}
                      onChange={(e) => {
                        setRegularesPercent(e.target.value)
                        // Auto-calcular ahorros para mantener suma = 100
                        const regulares = parseFloat(e.target.value) || 0
                        const inusuales = parseFloat(inusualesPercent) || 0
                        const remaining = 100 - regulares - inusuales
                        if (remaining >= 0 && remaining <= 100) {
                          setAhorrosPercent(String(remaining.toFixed(1)))
                        }
                      }}
                      disabled={loadingObjectives}
                    />
                    <p className="text-xs text-muted-foreground">
                      Gastos regulares y necesarios
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inusuales-percent">Inusuales (%)</Label>
                    <Input
                      id="inusuales-percent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={inusualesPercent}
                      onChange={(e) => {
                        setInusualesPercent(e.target.value)
                        // Auto-calcular ahorros para mantener suma = 100
                        const regulares = parseFloat(regularesPercent) || 0
                        const inusuales = parseFloat(e.target.value) || 0
                        const remaining = 100 - regulares - inusuales
                        if (remaining >= 0 && remaining <= 100) {
                          setAhorrosPercent(String(remaining.toFixed(1)))
                        }
                      }}
                      disabled={loadingObjectives}
                    />
                    <p className="text-xs text-muted-foreground">
                      Gastos inusuales y discrecionales
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ahorros-percent">Ahorros (%)</Label>
                    <Input
                      id="ahorros-percent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={ahorrosPercent}
                      onChange={(e) => {
                        setAhorrosPercent(e.target.value)
                        // Auto-calcular regulares para mantener suma = 100
                        const regulares = parseFloat(regularesPercent) || 0
                        const ahorros = parseFloat(e.target.value) || 0
                        const inusuales = parseFloat(inusualesPercent) || 0
                        const remaining = 100 - ahorros - inusuales
                        if (remaining >= 0 && remaining <= 100) {
                          setRegularesPercent(String(remaining.toFixed(1)))
                        }
                      }}
                      disabled={loadingObjectives}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ahorros e inversiones
                    </p>
                  </div>
                </div>

                {/* Total indicator */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className={`font-bold ${
                      Math.abs(parseFloat(regularesPercent) + parseFloat(inusualesPercent) + parseFloat(ahorrosPercent) - 100) < 0.1
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {(parseFloat(regularesPercent) + parseFloat(inusualesPercent) + parseFloat(ahorrosPercent)).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => {
                    const regulares = parseFloat(regularesPercent)
                    const inusuales = parseFloat(inusualesPercent)
                    const ahorros = parseFloat(ahorrosPercent)
                    const total = regulares + inusuales + ahorros

                    if (Math.abs(total - 100) > 0.1) {
                      toast({
                        title: 'Error de validación',
                        description: `Los porcentajes deben sumar 100%. Actual: ${total.toFixed(1)}%`,
                        variant: 'destructive',
                      })
                      return
                    }

                    setLoadingObjectives(true)
                    try {
                      updateObjectives({
                        regulares,
                        inusuales,
                        ahorros,
                      })
                      toast({
                        title: 'Objetivos guardados',
                        description: 'Los porcentajes de presupuesto se han actualizado correctamente',
                      })
                    } catch (error) {
                      toast({
                        title: 'Error al guardar',
                        description: error instanceof Error ? error.message : 'Ocurrió un error',
                        variant: 'destructive',
                      })
                    } finally {
                      setLoadingObjectives(false)
                    }
                  }}
                  disabled={loadingObjectives}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  {loadingObjectives ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Guardar Objetivos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
