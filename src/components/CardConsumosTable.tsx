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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { CardConsumo } from '@/src/lib/api'
import { formatCurrency } from '@/src/lib/format'
import { EmptyState } from './EmptyState'
import { Search } from 'lucide-react'

interface CardConsumosTableProps {
  consumos: CardConsumo[]
}

export function CardConsumosTable({ consumos }: CardConsumosTableProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedHolder, setSelectedHolder] = useState<string>('all')

  const holders = useMemo(() => {
    return Array.from(new Set(consumos.map(c => c.holder))).sort()
  }, [consumos])

  const filteredConsumos = useMemo(() => {
    return consumos.filter((c) => {
      const matchesSearch = searchText === '' || 
        c.descripcion.toLowerCase().includes(searchText.toLowerCase())
      const matchesHolder = selectedHolder === 'all' || 
        c.holder === selectedHolder
      return matchesSearch && matchesHolder
    })
  }, [consumos, searchText, selectedHolder])

  const filteredTotal = useMemo(() => {
    return filteredConsumos.reduce((sum, c) => sum + c.importe, 0)
  }, [filteredConsumos])

  const hasUSD = (descripcion: string) => {
    return descripcion.toUpperCase().includes('USD')
  }

  const showFilteredTotal = (selectedHolder !== 'all' || searchText !== '') && filteredConsumos.length > 0

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
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
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">Titular</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsumos.map((consumo, index) => (
                    <TableRow key={`${consumo.descripcion}-${consumo.fecha}-${index}`}>
                      <TableCell className="font-mono text-sm">
                        {consumo.fecha}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{consumo.holder}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${hasUSD(consumo.descripcion) ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {formatCurrency(consumo.importe)}
                      </TableCell>
                    </TableRow>
                  ))}
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
