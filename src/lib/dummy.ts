import type {
  Transaction,
  MonthlySummary,
  MonthlyListResponse,
  AnnualSummary,
  NetWorthSnapshot,
  EvolutionSeries,
  CategoryBreakdown,
  CreditCardSummary,
  CreditCardItem,
} from '@/src/types/finance'

// Categories for Argentina
export const EXPENSE_CATEGORIES = [
  'Casa',
  'Transporte',
  'Comida',
  'Actividades',
  'Educación',
  'Equipo',
  'Necesidades',
  'Salud',
  'Cuotas',
  'Servicios',
  'Entretenimiento',
  'Ropa',
  'Otros',
]

export const INCOME_CATEGORIES = [
  'Sueldo',
  'Freelance',
  'Inversiones',
  'Alquiler',
  'Otros',
]

export const SAVINGS_CATEGORIES = [
  'Plazo Fijo',
  'Dólares',
  'Crypto',
  'Fondos',
  'Acciones',
  'Otros',
]

// Credit Card Merchants
export const TARJETA_MERCHANTS = [
  'MERCADOLIBRE',
  'OSDE',
  'SEGURO',
  'INTERNET',
  'ABL',
  'RAPPI',
  'PEDIDOS YA',
]

// Generate consistent UUID based on seed
function generateUUID(seed: number): string {
  const hex = seed.toString(16).padStart(8, '0')
  return `${hex}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex}${hex.slice(0, 4)}`
}

// Generate dummy transactions for a specific month
function generateExpenses(year: number, month: number): Transaction[] {
  const seed = year * 100 + month
  const baseAmount = 50000 + (seed % 30000)
  
  return [
    {
      uuid: generateUUID(seed + 1),
      date: `${year}-${String(month).padStart(2, '0')}-05`,
      amount: baseAmount * 0.3,
      currency: 'ARS',
      category: 'Casa',
      description: 'Alquiler mensual',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 2),
      date: `${year}-${String(month).padStart(2, '0')}-08`,
      amount: baseAmount * 0.15,
      currency: 'ARS',
      category: 'Comida',
      description: 'Supermercado Carrefour',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 3),
      date: `${year}-${String(month).padStart(2, '0')}-10`,
      amount: baseAmount * 0.08,
      currency: 'ARS',
      category: 'Transporte',
      description: 'Nafta',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 4),
      date: `${year}-${String(month).padStart(2, '0')}-12`,
      amount: baseAmount * 0.05,
      currency: 'ARS',
      category: 'Servicios',
      description: 'Luz EDENOR',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 5),
      date: `${year}-${String(month).padStart(2, '0')}-12`,
      amount: baseAmount * 0.04,
      currency: 'ARS',
      category: 'Servicios',
      description: 'Gas Metrogas',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 6),
      date: `${year}-${String(month).padStart(2, '0')}-15`,
      amount: baseAmount * 0.1,
      currency: 'ARS',
      category: 'Comida',
      description: 'Restaurante cumpleaños',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 7),
      date: `${year}-${String(month).padStart(2, '0')}-18`,
      amount: baseAmount * 0.06,
      currency: 'ARS',
      category: 'Salud',
      description: 'Farmacia',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 8),
      date: `${year}-${String(month).padStart(2, '0')}-20`,
      amount: baseAmount * 0.12,
      currency: 'ARS',
      category: 'Cuotas',
      description: 'Cuota auto',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 9),
      date: `${year}-${String(month).padStart(2, '0')}-22`,
      amount: baseAmount * 0.03,
      currency: 'ARS',
      category: 'Entretenimiento',
      description: 'Netflix + Spotify',
      type: 'EGRESO',
    },
    {
      uuid: generateUUID(seed + 10),
      date: `${year}-${String(month).padStart(2, '0')}-25`,
      amount: baseAmount * 0.07,
      currency: 'ARS',
      category: 'Actividades',
      description: 'Gimnasio',
      type: 'EGRESO',
    },
  ]
}

function generateIncome(year: number, month: number): Transaction[] {
  const seed = year * 100 + month
  const baseIncome = 450000 + (seed % 50000)
  
  return [
    {
      uuid: generateUUID(seed + 100),
      date: `${year}-${String(month).padStart(2, '0')}-01`,
      amount: baseIncome,
      currency: 'ARS',
      category: 'Sueldo',
      description: 'Sueldo mensual',
      type: 'INGRESO',
    },
    {
      uuid: generateUUID(seed + 101),
      date: `${year}-${String(month).padStart(2, '0')}-15`,
      amount: baseIncome * 0.2,
      currency: 'ARS',
      category: 'Freelance',
      description: 'Proyecto web cliente',
      type: 'INGRESO',
    },
  ]
}

function generateSavings(year: number, month: number): Transaction[] {
  const seed = year * 100 + month
  const baseSaving = 80000 + (seed % 20000)
  
  return [
    {
      uuid: generateUUID(seed + 200),
      date: `${year}-${String(month).padStart(2, '0')}-05`,
      amount: baseSaving * 0.5,
      currency: 'ARS',
      category: 'Plazo Fijo',
      description: 'Renovación plazo fijo',
      type: 'AHORRO',
    },
    {
      uuid: generateUUID(seed + 201),
      date: `${year}-${String(month).padStart(2, '0')}-10`,
      amount: baseSaving * 0.3,
      currency: 'USD',
      category: 'Dólares',
      description: 'Compra USD',
      type: 'AHORRO',
    },
    {
      uuid: generateUUID(seed + 202),
      date: `${year}-${String(month).padStart(2, '0')}-20`,
      amount: baseSaving * 0.2,
      currency: 'ARS',
      category: 'Fondos',
      description: 'FCI Balanceado',
      type: 'AHORRO',
    },
  ]
}

// Calculate category breakdown from transactions
function calculateBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const categoryTotals: Record<string, number> = {}
  const total = transactions.reduce((sum, t) => sum + t.amount, 0)
  
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
  })
  
  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// =============================================================================
// PUBLIC DEMO DATA FUNCTIONS
// =============================================================================

export function getDemoMonthlySummary(year: number, month: number): MonthlySummary {
  const expenses = generateExpenses(year, month)
  const income = generateIncome(year, month)
  const savings = generateSavings(year, month)
  
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
  const totalSavings = savings.reduce((sum, t) => sum + t.amount, 0)
  
  return {
    year,
    month,
    totalExpenses,
    totalIncome,
    totalSavings,
    balance: totalIncome - totalExpenses - totalSavings,
    topCategories: calculateBreakdown(expenses).slice(0, 5),
  }
}

export function getDemoMonthlyExpenses(year: number, month: number): MonthlyListResponse<Transaction> {
  const items = generateExpenses(year, month)
  const total = items.reduce((sum, t) => sum + t.amount, 0)
  
  return {
    items,
    totals: { total, count: items.length },
    breakdown: calculateBreakdown(items),
  }
}

export function getDemoMonthlyIncome(year: number, month: number): MonthlyListResponse<Transaction> {
  const items = generateIncome(year, month)
  const total = items.reduce((sum, t) => sum + t.amount, 0)
  
  return {
    items,
    totals: { total, count: items.length },
    breakdown: calculateBreakdown(items),
  }
}

export function getDemoMonthlySavings(year: number, month: number): MonthlyListResponse<Transaction> {
  const items = generateSavings(year, month)
  const total = items.reduce((sum, t) => sum + t.amount, 0)
  
  return {
    items,
    totals: { total, count: items.length },
    breakdown: calculateBreakdown(items),
  }
}

export function getDemoAnnualSummary(year: number): AnnualSummary {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  
  const months = monthNames.map((monthName, index) => {
    const month = index + 1
    const summary = getDemoMonthlySummary(year, month)
    return {
      month,
      monthName,
      expenses: summary.totalExpenses,
      income: summary.totalIncome,
      savings: summary.totalSavings,
      balance: summary.balance,
    }
  })
  
  const totals = months.reduce(
    (acc, m) => ({
      expenses: acc.expenses + m.expenses,
      income: acc.income + m.income,
      savings: acc.savings + m.savings,
      balance: acc.balance + m.balance,
    }),
    { expenses: 0, income: 0, savings: 0, balance: 0 }
  )
  
  return { year, months, totals }
}

export function getDemoNetWorth(): NetWorthSnapshot {
  return {
    date: new Date().toISOString(),
    totalAssets: 15500000,
    totalDebts: 2800000,
    netWorth: 12700000,
    assets: [
      { name: 'Cuenta Corriente', value: 850000, category: 'Efectivo' },
      { name: 'Caja de Ahorro USD', value: 3200000, category: 'Efectivo' },
      { name: 'Plazo Fijo', value: 2500000, category: 'Inversiones' },
      { name: 'FCI Balanceado', value: 1800000, category: 'Inversiones' },
      { name: 'Crypto (BTC/ETH)', value: 950000, category: 'Inversiones' },
      { name: 'Auto', value: 4500000, category: 'Bienes' },
      { name: 'Electrodomésticos', value: 1700000, category: 'Bienes' },
    ],
    debts: [
      { name: 'Préstamo Personal', value: 1200000, category: 'Préstamos' },
      { name: 'Tarjeta de Crédito', value: 450000, category: 'Tarjetas' },
      { name: 'Cuotas Auto', value: 1150000, category: 'Cuotas' },
    ],
    breakdown: [
      { category: 'Efectivo', amount: 4050000 },
      { category: 'Inversiones', amount: 5250000 },
      { category: 'Bienes', amount: 6200000 },
    ],
  }
}

export function getDemoCreditCard(year: number, month: number): CreditCardSummary {
  const seed = year * 100 + month

  const items: CreditCardItem[] = [
    // Cuotas (installments)
    {
      uuid: generateUUID(seed + 500),
      merchant: 'MERCADOLIBRE',
      amount: 45000,
      currency: 'ARS',
      isInstallment: true,
      currentInstallment: ((seed % 6) + 1),
      totalInstallments: 12,
      description: 'Auriculares Sony WH-1000XM5',
    },
    {
      uuid: generateUUID(seed + 501),
      merchant: 'MERCADOLIBRE',
      amount: 28000,
      currency: 'ARS',
      isInstallment: true,
      currentInstallment: ((seed % 3) + 1),
      totalInstallments: 6,
      description: 'Monitor LG 27"',
    },
    {
      uuid: generateUUID(seed + 502),
      merchant: 'MERCADOLIBRE',
      amount: 15000,
      currency: 'ARS',
      isInstallment: true,
      currentInstallment: ((seed % 2) + 1),
      totalInstallments: 3,
      description: 'Teclado mecánico',
    },
    // One-time payments (servicios mensuales)
    {
      uuid: generateUUID(seed + 510),
      merchant: 'OSDE',
      amount: 125000,
      currency: 'ARS',
      isInstallment: false,
      description: 'Plan familiar 410',
    },
    {
      uuid: generateUUID(seed + 511),
      merchant: 'SEGURO',
      amount: 42000,
      currency: 'ARS',
      isInstallment: false,
      description: 'Seguro auto La Caja',
    },
    {
      uuid: generateUUID(seed + 512),
      merchant: 'INTERNET',
      amount: 28000,
      currency: 'ARS',
      isInstallment: false,
      description: 'Fibertel 300mb',
    },
    {
      uuid: generateUUID(seed + 513),
      merchant: 'ABL',
      amount: 18500,
      currency: 'ARS',
      isInstallment: false,
      description: 'ABL bimestral',
    },
    {
      uuid: generateUUID(seed + 514),
      merchant: 'RAPPI',
      amount: 35000 + (seed % 15000),
      currency: 'ARS',
      isInstallment: false,
      description: 'Pedidos del mes',
    },
    {
      uuid: generateUUID(seed + 515),
      merchant: 'PEDIDOS YA',
      amount: 22000 + (seed % 10000),
      currency: 'ARS',
      isInstallment: false,
      description: 'Pedidos del mes',
    },
  ]

  const totalCuotas = items
    .filter(i => i.isInstallment)
    .reduce((sum, i) => sum + i.amount, 0)

  const totalOneTime = items
    .filter(i => !i.isInstallment)
    .reduce((sum, i) => sum + i.amount, 0)

  return {
    totalCuotas,
    totalOneTime,
    total: totalCuotas + totalOneTime,
    items,
  }
}

export function getDemoEvolution(year: number, month: number, range: '6m' | '12m' | '24m'): EvolutionSeries {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const rangeMonths = range === '6m' ? 6 : range === '12m' ? 12 : 24
  
  const data = []
  let currentYear = year
  let currentMonth = month
  
  // Go back in time
  for (let i = rangeMonths - 1; i >= 0; i--) {
    let targetMonth = currentMonth - i
    let targetYear = currentYear
    
    while (targetMonth <= 0) {
      targetMonth += 12
      targetYear -= 1
    }
    
    const summary = getDemoMonthlySummary(targetYear, targetMonth)
    const netWorth = 10000000 + (targetYear * 12 + targetMonth) * 50000 + Math.random() * 500000
    
    data.push({
      date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`,
      month: `${monthNames[targetMonth - 1]} ${targetYear}`,
      expenses: summary.totalExpenses,
      income: summary.totalIncome,
      savings: summary.totalSavings,
      netWorth: Math.round(netWorth),
    })
  }
  
  return { range, data }
}
