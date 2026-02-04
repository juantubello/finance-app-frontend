'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { saveCardPaymentFx } from '@/src/lib/api'
import { Loader2 } from 'lucide-react'

interface CardPaymentNotificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  month: number
  defaultDolarTarjeta: number | null
  onSuccess: () => void
}

export function CardPaymentNotification({
  open,
  onOpenChange,
  year,
  month,
  defaultDolarTarjeta,
  onSuccess,
}: CardPaymentNotificationProps) {
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Reset amount when dialog opens or defaultDolarTarjeta changes
  useEffect(() => {
    if (open && defaultDolarTarjeta) {
      setAmount(defaultDolarTarjeta.toString())
    }
  }, [open, defaultDolarTarjeta])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const numericAmount = parseFloat(amount)
    
    // Validation
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un valor válido mayor a 0',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await saveCardPaymentFx({
        year,
        month,
        amount: numericAmount,
      })

      toast({
        title: 'Éxito',
        description: 'Tipo de cambio guardado correctamente',
      })

      onSuccess()
      onOpenChange(false)
      setAmount('')
    } catch (error) {
      console.error('Error saving payment FX:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar el tipo de cambio',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notificar Pago de Tarjeta</DialogTitle>
          <DialogDescription>
            Ingresa el tipo de cambio (dólar tarjeta BBVA) usado para pagar el resumen de {month}/{year}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Dólar Tarjeta BBVA</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej: 1470.00"
                disabled={loading}
                required
              />
              {defaultDolarTarjeta && (
                <p className="text-xs text-muted-foreground">
                  Valor actual de BBVA: ${defaultDolarTarjeta.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
