'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { savePatrimonio } from '@/src/lib/api'
import type { PatrimonioRequest } from '@/src/lib/api'
import { Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PatrimonioForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<PatrimonioRequest['type']>('BITCOIN')
  const [quantity, setQuantity] = useState('')
  const [valueUsd, setValueUsd] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  const handleSubmit = async () => {
    // Validation
    if (type === 'BITCOIN' || type === 'CEDEAR') {
      if (!quantity || parseFloat(quantity) <= 0) {
        toast({
          title: 'Error de validación',
          description: 'La cantidad debe ser mayor a 0',
          variant: 'destructive',
        })
        return
      }
    } else {
      if (!valueUsd || parseFloat(valueUsd) <= 0) {
        toast({
          title: 'Error de validación',
          description: 'El valor en USD debe ser mayor a 0',
          variant: 'destructive',
        })
        return
      }
      if (type === 'PATRIMONIO_USD' && !description) {
        toast({
          title: 'Error de validación',
          description: 'La descripción es requerida',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      const data: PatrimonioRequest = {
        type,
        ...(type === 'BITCOIN' || type === 'CEDEAR' 
          ? { quantity: parseFloat(quantity) }
          : { value_usd: valueUsd }),
        ...(type === 'PATRIMONIO_USD' ? { description } : {}),
      }

      const response = await savePatrimonio(data)
      
      if (response.success !== false && !response.error) {
        toast({
          title: 'Patrimonio guardado',
          description: response.message || 'El patrimonio se ha guardado correctamente',
        })
        // Reset form
        setQuantity('')
        setValueUsd('')
        setDescription('')
        setOpen(false)
        onSuccess?.()
      } else {
        toast({
          title: 'Error al guardar',
          description: response.error || response.message || 'Ocurrió un error',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error al guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setQuantity('')
    setValueUsd('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Cargar Patrimonio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cargar Patrimonio</DialogTitle>
          <DialogDescription>
            Agrega o actualiza un item de patrimonio
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v) => {
              setType(v as PatrimonioRequest['type'])
              resetForm()
            }}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BITCOIN">Bitcoin</SelectItem>
                <SelectItem value="CEDEAR">CEDEAR (SPY500)</SelectItem>
                <SelectItem value="PATRIMONIO_USD">Patrimonio en USD</SelectItem>
                <SelectItem value="USD_FISICO">USD Físico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity for Bitcoin and CEDEAR */}
          {(type === 'BITCOIN' || type === 'CEDEAR') && (
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {type === 'BITCOIN' ? 'Cantidad (BTC)' : 'Cantidad CEDEAR NOMINAL'}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={type === 'BITCOIN' ? 'Ej: 0.005197' : 'Ej: 10'}
                disabled={loading}
              />
            </div>
          )}

          {/* Value USD for Patrimonio USD and USD Físico */}
          {(type === 'PATRIMONIO_USD' || type === 'USD_FISICO') && (
            <div className="space-y-2">
              <Label htmlFor="value-usd">Valor en USD</Label>
              <Input
                id="value-usd"
                type="number"
                step="0.01"
                value={valueUsd}
                onChange={(e) => setValueUsd(e.target.value)}
                placeholder="Ej: 30000.00"
                disabled={loading}
              />
            </div>
          )}

          {/* Description for Patrimonio USD */}
          {type === 'PATRIMONIO_USD' && (
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Auto"
                disabled={loading}
                rows={2}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
