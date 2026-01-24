// Transaction Types
export type TransactionType = 'EGRESO' | 'INGRESO' | 'AHORRO'

export interface Transaction {
  uuid: string
  date: string // ISO string
  amount: number
  currency: string
  category: string
  description: string
  type: TransactionType
}

// Monthly Summary
export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
}

export interface MonthlySummary {
  year: number
  month: number
  totalExpenses: number
  totalIncome: number
  totalSavings: number
  balance: number
  topCategories: CategoryBreakdown[]
}

export interface MonthlyListResponse<T = Transaction> {
  items: T[]
  totals: {
    total: number
    count: number
  }
  breakdown: CategoryBreakdown[]
}

// Annual Summary
export interface MonthlyRow {
  month: number
  monthName: string
  expenses: number
  income: number
  savings: number
  balance: number
}

export interface AnnualSummary {
  year: number
  months: MonthlyRow[]
  totals: {
    expenses: number
    income: number
    savings: number
    balance: number
  }
}

// Net Worth
export interface Asset {
  name: string
  value: number
  category: string
}

export interface Debt {
  name: string
  value: number
  category: string
}

export interface NetWorthSnapshot {
  date: string
  totalAssets: number
  totalDebts: number
  netWorth: number
  assets: Asset[]
  debts: Debt[]
  breakdown: {
    category: string
    amount: number
  }[]
}

// Evolution
export interface EvolutionDataPoint {
  date: string
  month: string
  expenses: number
  income: number
  savings: number
  netWorth: number
}

export interface EvolutionSeries {
  range: '6m' | '12m' | '24m'
  data: EvolutionDataPoint[]
}

// Credit Card / Tarjeta
export interface CreditCardItem {
  uuid: string
  merchant: string
  amount: number
  currency: string
  isInstallment: boolean // true = cuota, false = pago único
  currentInstallment?: number // e.g., 3 of 12
  totalInstallments?: number
  description?: string
}

export interface CreditCardSummary {
  totalCuotas: number
  totalOneTime: number
  total: number
  items: CreditCardItem[]
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
