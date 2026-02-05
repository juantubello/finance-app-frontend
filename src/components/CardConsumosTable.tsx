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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CardConsumo } from '@/src/lib/api'
import { formatCurrency } from '@/src/lib/format'
import { EmptyState } from './EmptyState'
import { Search, X, Plus, ArrowUpDown, ArrowUp, ArrowDown, Settings } from 'lucide-react'

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
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cuotas' | 'pago-unico'>('all')
  const [showUsd, setShowUsd] = useState(false)
  const [sortBy, setSortBy] = useState<'importe' | 'fecha'>('importe')
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
      
      // Filter by payment type: 'all', 'cuotas', or 'pago-unico'
      if (paymentFilter === 'cuotas') {
        // Only show cuotas
        if (!c.is_cuota) {
          return false
        }
      } else if (paymentFilter === 'pago-unico') {
        // Only show non-cuotas (single payments)
        if (c.is_cuota) {
          return false
        }
      }
      // If paymentFilter === 'all', show everything (no filter)
      
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
    
    // Sort by selected field
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'importe') {
        if (sortOrder === 'asc') {
          return a.importe - b.importe
        } else {
          return b.importe - a.importe
        }
      } else {
        // Sort by fecha (format: DD-MMM-YY, e.g., "09-Ago-25")
        const parseDate = (fecha: string): number => {
          if (!fecha || typeof fecha !== 'string') return 0
          
          // Try parsing DD-MMM-YY format first (e.g., "09-Ago-25")
          const parts = fecha.trim().split('-')
          if (parts.length === 3) {
            const day = parseInt(parts[0]?.trim() || '0', 10)
            const monthStr = parts[1]?.trim().toLowerCase()
            const yearStr = parts[2]?.trim()
            
            // Map Spanish month abbreviations to numbers
            const monthMap: Record<string, number> = {
              'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
              'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
            }
            
            const month = monthMap[monthStr] || 0
            
            // Parse year (YY format, assume 20XX)
            let year = parseInt(yearStr || '0', 10)
            if (year < 100) {
              year = 2000 + year
            }
            
            if (!isNaN(day) && month > 0 && day > 0 && day <= 31) {
              const date = new Date(year, month - 1, day)
              const timestamp = date.getTime()
              
              // Validate the date was created correctly
              if (!isNaN(timestamp) && date.getDate() === day && date.getMonth() === month - 1) {
                return timestamp
              }
            }
          }
          
          // Fallback: try DD/MM format
          const slashParts = fecha.trim().split('/')
          if (slashParts.length === 2) {
            const day = parseInt(slashParts[0]?.trim() || '0', 10)
            const month = parseInt(slashParts[1]?.trim() || '0', 10)
            
            if (!isNaN(day) && !isNaN(month) && day > 0 && day <= 31 && month > 0 && month <= 12) {
              const currentYear = new Date().getFullYear()
              const date = new Date(currentYear, month - 1, day)
              const timestamp = date.getTime()
              
              if (!isNaN(timestamp) && date.getDate() === day && date.getMonth() === month - 1) {
                return timestamp
              }
            }
          }
          
          // If parsing fails, return a very old date so invalid dates go to the end
          return 0
        }
        const dateA = parseDate(a.fecha)
        const dateB = parseDate(b.fecha)
        
        // Handle invalid dates - put them at the end
        if (dateA === 0 && dateB === 0) return 0
        if (dateA === 0) return 1 // Invalid dates go to end
        if (dateB === 0) return -1 // Invalid dates go to end
        
        if (sortOrder === 'asc') {
          return dateA - dateB
        } else {
          return dateB - dateA
        }
      }
    })
    
    return sorted
  }, [consumos, descriptionFilters, selectedHolder, showCuotasALiberar, paymentFilter, sortBy, sortOrder])

  const filteredTotal = useMemo(() => {
    return filteredConsumos.reduce((sum, c) => sum + c.importe, 0)
  }, [filteredConsumos])

  const hasUSD = (descripcion: string) => {
    return descripcion.toUpperCase().includes('USD')
  }

  const showFilteredTotal = (selectedHolder !== 'all' || descriptionFilters.length > 0 || showCuotasALiberar || paymentFilter !== 'all') && filteredConsumos.length > 0

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

        {/* Holder Filter and Options Menu */}
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
          
          {/* Options Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Settings className="h-4 w-4 mr-2" />
                Opciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtros y opciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Cuotas a Liberar Toggle */}
              <div className="flex items-center justify-between px-2 py-1.5">
                <Label 
                  htmlFor="cuotas-a-liberar-dropdown" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Cuotas a liberar
                </Label>
                <Switch
                  id="cuotas-a-liberar-dropdown"
                  checked={showCuotasALiberar}
                  onCheckedChange={setShowCuotasALiberar}
                />
              </div>
              
              {/* Payment Type Filter */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Tipo de pago</DropdownMenuLabel>
              <div className="px-2 py-1.5 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="filter-all"
                    name="payment-filter"
                    checked={paymentFilter === 'all'}
                    onChange={() => setPaymentFilter('all')}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor="filter-all" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Todos (pago y cuotas)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="filter-cuotas"
                    name="payment-filter"
                    checked={paymentFilter === 'cuotas'}
                    onChange={() => setPaymentFilter('cuotas')}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor="filter-cuotas" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Solo cuotas
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="filter-pago-unico"
                    name="payment-filter"
                    checked={paymentFilter === 'pago-unico'}
                    onChange={() => setPaymentFilter('pago-unico')}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor="filter-pago-unico" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Solo pago único
                  </Label>
                </div>
              </div>
              
              {/* Show USD Toggle */}
              {conversionAmount && (
                <>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <Label 
                      htmlFor="show-usd-dropdown" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Mostrar USD
                    </Label>
                    <Switch
                      id="show-usd-dropdown"
                      checked={showUsd}
                      onCheckedChange={setShowUsd}
                    />
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <TableHead className={`text-right ${sortBy === 'importe' ? 'bg-slate-700 dark:bg-slate-700' : ''}`}>
                      <button
                        onClick={() => {
                          if (sortBy === 'importe') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('importe')
                            setSortOrder('desc')
                          }
                        }}
                        className={`flex items-center gap-1 hover:text-white transition-colors group ml-auto ${
                          sortBy === 'importe' ? 'text-white font-semibold' : ''
                        }`}
                        title="Ordenar por importe"
                      >
                        Importe
                        {sortBy === 'importe' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-4 w-4 text-white" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-white" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className={`w-[100px] ${sortBy === 'fecha' ? 'bg-slate-700 dark:bg-slate-700' : ''}`}>
                      <button
                        onClick={() => {
                          if (sortBy === 'fecha') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('fecha')
                            setSortOrder('desc')
                          }
                        }}
                        className={`flex items-center gap-1 hover:text-white transition-colors group ${
                          sortBy === 'fecha' ? 'text-white font-semibold' : ''
                        }`}
                        title="Ordenar por fecha"
                      >
                        Fecha
                        {sortBy === 'fecha' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-4 w-4 text-white" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-white" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </TableHead>
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
