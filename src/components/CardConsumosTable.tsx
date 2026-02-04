'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { CardConsumo } from '@/src/lib/api'
import { formatCurrency } from '@/src/lib/format'
import { EmptyState } from './EmptyState'
import { Search, X, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type CardConsumoWithType = CardConsumo & { cardType?: 'visa' | 'mastercard' }

interface CardConsumosTableProps {
  consumos: CardConsumoWithType[]
  showCardType?: boolean
  conversionAmount?: number
}

export function CardConsumosTable({ consumos, showCardType = false, conversionAmount }: CardConsumosTableProps) {
  const [descriptionFilters, setDescriptionFilters] = useState<string[]>([])
  const [newFilterText, setNewFilterText] = useState('')
  const [selectedHolder, setSelectedHolder] = useState<string>('all')
  const [showCuotasALiberar, setShowCuotasALiberar] = useState(false)
  const [showUsd, setShowUsd] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const holders = useMemo(() => {
    return Array.from(new Set(consumos.map(c => c.holder))).sort()
  }, [consumos])

  const addDescriptionFilter = () => {
    const trimmed = newFilterText.trim().toLowerCase()
    if (trimmed && !descriptionFilters.includes(trimmed)) {
      setDescriptionFilters([...descriptionFilters, trimmed])
      setNewFilterText('')
    }
  }

  const removeDescriptionFilter = (filterToRemove: string) => {
    setDescriptionFilters(descriptionFilters.filter(f => f !== filterToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addDescriptionFilter()
    }
  }

  // Check if a consumo is the last cuota (cuota a liberar)
  const isCuotaALiberar = (consumo: CardConsumoWithType): boolean => {
    if (!consumo.is_cuota) return false
    
    // Pattern: C.XX/XX where both XX are the same
    const pattern = /C\.(\d{2})\/(\d{2})/
    const match = consumo.descripcion.match(pattern)
    
    if (match) {
      const firstDigits = match[1]
      const lastDigits = match[2]
      return firstDigits === lastDigits
    }
    
    return false
  }

  const filteredConsumos = useMemo(() => {
    const filtered = consumos.filter((c) => {
      // Filter by "Cuotas a liberar" - if active, only show those
      if (showCuotasALiberar && !isCuotaALiberar(c)) {
        return false
      }
      
      // Match if description contains ANY of the active filters (OR logic)
      let matchesSearch = true
      if (descriptionFilters.length > 0) {
        matchesSearch = descriptionFilters.some(filter => 
          c.descripcion.toLowerCase().includes(filter)
        )
      }
      
      const matchesHolder = selectedHolder === 'all' || 
        c.holder === selectedHolder
      return matchesSearch && matchesHolder
    })
    
    // Sort by importe
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.importe - b.importe
      } else {
        return b.importe - a.importe
      }
    })
    
    return sorted
  }, [consumos, descriptionFilters, selectedHolder, showCuotasALiberar, sortOrder])

  const filteredTotal = useMemo(() => {
    return filteredConsumos.reduce((sum, c) => sum + c.importe, 0)
  }, [filteredConsumos])

  const hasUSD = (descripcion: string) => {
    return descripcion.toUpperCase().includes('USD')
  }

  const showFilteredTotal = (selectedHolder !== 'all' || descriptionFilters.length > 0 || showCuotasALiberar) && filteredConsumos.length > 0

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        {/* Description Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Agregar filtro por descripción (ej: UBER)..."
                value={newFilterText}
                onChange={(e) => setNewFilterText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={addDescriptionFilter}
              disabled={!newFilterText.trim()}
              className="sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Filtro
            </Button>
          </div>
          
          {/* Active Filters */}
          {descriptionFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {descriptionFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                >
                  <span>{filter}</span>
                  <button
                    onClick={() => removeDescriptionFilter(filter)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    aria-label={`Eliminar filtro ${filter}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {descriptionFilters.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDescriptionFilters([])}
                  className="h-7 text-xs"
                >
                  Limpiar todos
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Holder Filter and Cuotas a Liberar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedHolder} onValueChange={setSelectedHolder}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Titular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los titulares</SelectItem>
              {holders.map((holder) => (
                <SelectItem key={holder} value={holder}>
                  {holder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Cuotas a Liberar Toggle */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-md border bg-background">
            <Switch
              id="cuotas-a-liberar"
              checked={showCuotasALiberar}
              onCheckedChange={setShowCuotasALiberar}
            />
            <Label 
              htmlFor="cuotas-a-liberar" 
              className="text-sm font-medium cursor-pointer"
            >
              Cuotas a liberar
            </Label>
          </div>
          
          {/* Show USD Toggle */}
          {conversionAmount && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-md border bg-background">
              <Switch
                id="show-usd"
                checked={showUsd}
                onCheckedChange={setShowUsd}
              />
              <Label 
                htmlFor="show-usd" 
                className="text-sm font-medium cursor-pointer"
              >
                Show USD
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Filtered Total - Visible without scrolling */}
      {showFilteredTotal && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total filtrado:</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(filteredTotal)}</span>
          </div>
        </div>
      )}

      {/* Table - fixed height to show exactly 16 rows */}
      <div className="flex flex-col flex-1 min-h-0">
        {filteredConsumos.length === 0 ? (
          <EmptyState 
            title="Sin resultados"
            description="No se encontraron consumos con los filtros aplicados."
          />
        ) : (
          <div className="border rounded-lg overflow-hidden flex flex-col" style={{ height: '841px' }}>
            <div className="overflow-auto h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-right">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Importe
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead className="hidden sm:table-cell">Titular</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsumos.map((consumo, index) => {
                    const isVisa = showCardType && consumo.cardType === 'visa'
                    const isMastercard = showCardType && consumo.cardType === 'mastercard'
                    
                    return (
                      <TableRow 
                        key={`${consumo.descripcion}-${consumo.fecha}-${index}`}
                        className={`
                          ${isVisa ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30' : ''}
                          ${isMastercard ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30' : ''}
                        `}
                      >
                        <TableCell className={`text-right font-mono ${hasUSD(consumo.descripcion) ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {hasUSD(consumo.descripcion) && showUsd && conversionAmount ? (
                            formatCurrency(consumo.importe / conversionAmount, 'USD')
                          ) : (
                            formatCurrency(consumo.importe)
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={hasUSD(consumo.descripcion) ? 'text-green-600 dark:text-green-400' : ''}>
                              {consumo.descripcion}
                            </span>
                            {consumo.is_cuota && (
                              <Badge variant="secondary" className="text-xs">
                                Cuota
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {consumo.fecha}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{consumo.holder}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground flex-shrink-0">
        Mostrando {filteredConsumos.length} de {consumos.length} consumos
      </div>
    </div>
  )
}
