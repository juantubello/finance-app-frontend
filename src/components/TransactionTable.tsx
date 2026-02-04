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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { Transaction } from '@/src/types/finance'
import { formatCurrency, formatShortDate } from '@/src/lib/format'
import { EmptyState } from './EmptyState'
import { Search, ChevronDown } from 'lucide-react'

interface TransactionTableProps {
  transactions: Transaction[]
  categories: string[]
}

export function TransactionTable({ transactions, categories }: TransactionTableProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = searchText === '' || 
        t.description.toLowerCase().includes(searchText.toLowerCase())
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(t.category)
      return matchesSearch && matchesCategory
    })
  }, [transactions, searchText, selectedCategories])

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const clearCategories = () => {
    setSelectedCategories([])
  }

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [filteredTransactions])

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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[200px] justify-between">
              <span>
                {selectedCategories.length === 0 
                  ? 'Todas las categorías' 
                  : `${selectedCategories.length} categoría${selectedCategories.length > 1 ? 's' : ''}`
                }
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <div className="p-2 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Categorías</span>
                {selectedCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCategories}
                    className="h-6 px-2 text-xs"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => toggleCategory(cat)}
                >
                  <Checkbox
                    id={cat}
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <label
                    htmlFor={cat}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {cat}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table - fixed height to show exactly 16 rows */}
      <div className="flex flex-col flex-1 min-h-0">
        {filteredTransactions.length === 0 ? (
          <EmptyState 
            title="Sin resultados"
            description="No se encontraron transacciones con los filtros aplicados."
          />
        ) : (
          <div className="border rounded-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
            <div className="overflow-auto h-full w-full">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.uuid}>
                      <TableCell className="font-mono text-sm">
                        {formatShortDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="sm:hidden">
                            <Badge variant="secondary" className="text-xs mt-1">
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {filteredTransactions.length > 0 && (
                  <TableFooter className="sticky bottom-0 bg-muted/50">
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {formatCurrency(filteredTotal, filteredTransactions[0]?.currency || 'ARS')}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground flex-shrink-0">
        Mostrando {filteredTransactions.length} de {transactions.length} transacciones
      </div>
    </div>
  )
}
