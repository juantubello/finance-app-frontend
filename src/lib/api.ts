import type {
  MonthlySummary,
  MonthlyListResponse,
  Transaction,
  TransactionType,
  CategoryBreakdown,
  AnnualSummary,
  MonthlyRow,
  NetWorthSnapshot,
  EvolutionSeries,
} from '@/src/types/finance'
import { getMonthName } from '@/src/lib/format'

// Configuration
// 🔧 CONFIGURACIÓN: Esta variable viene del archivo .env
// Si no está definida, usa el fallback (solo para desarrollo local)
// ⚠️ En producción, siempre debe estar definida en .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// Toggle for demo mode - set to false when backend is ready
export const USE_DEMO_DATA = true

// Generic fetch wrapper with error handling
// TODO: Add authentication headers when auth is implemented
// Example: headers: { 'Authorization': `Bearer ${token}` }
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add auth headers here
        // 'Authorization': `Bearer ${getAuthToken()}`,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API Error: ${response.status} ${errorText || response.statusText}`)
    }

    return response.json()
  } catch (error) {
    // Improve error messages for network failures
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`No se pudo conectar al backend en ${url}. Verifica que el servidor esté corriendo y accesible.`)
    }
    throw error
  }
}

// Build query params helper
function buildParams(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })
  return searchParams.toString()
}

// =============================================================================
// API ENDPOINTS - All endpoints include year/month params where applicable
// =============================================================================

/**
 * GET /monthly/summary
 * Returns dashboard summary for a specific month (combines expenses, income, savings)
 */
export async function fetchMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const [expensesData, incomeData, savingsData] = await Promise.all([
    fetchMonthlyExpenses(year, month),
    fetchMonthlyIncome(year, month),
    fetchMonthlySavings(year, month),
  ])

  const totalExpenses = expensesData.totals.total
  const totalIncome = incomeData.totals.total
  const totalSavings = savingsData.totals.total
  const balance = totalIncome - totalExpenses + totalSavings

  return {
    year,
    month,
    totalExpenses,
    totalIncome,
    totalSavings,
    balance,
    topCategories: expensesData.breakdown.slice(0, 5), // Top 5 categories
  }
}

// API Response types for expenses endpoint
interface ApiExpense {
  uuid: string
  datetime: string
  year: number
  month: number
  type: string
  amount: number
  amount_cents: number
  currency: string
  category: string
  description: string
  affects_liquidity: number
}

interface ApiExpensesResponse {
  year: number
  month: number
  currency: string
  total: number
  total_amount: number
  total_amount_cents: number
  expenses: ApiExpense[]
}

/**
 * GET /expenses
 * Returns list of expenses for a specific month
 * Optionally filter by category
 */
export async function fetchMonthlyExpenses(
  year: number, 
  month: number,
  category?: string
): Promise<MonthlyListResponse<Transaction>> {
  const params = buildParams({ year, month })
  const response = await fetchApi<ApiExpensesResponse>(`/expenses?${params}`)
  
  // Map API response to frontend format
  let transactions: Transaction[] = response.expenses.map((expense) => ({
    uuid: expense.uuid,
    date: expense.datetime,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    description: expense.description,
    type: 'EGRESO' as TransactionType,
  }))

  // Filter by category if provided
  if (category) {
    transactions = transactions.filter((t) => t.category === category)
  }

  // Calculate breakdown by category
  const categoryMap = new Map<string, number>()
  transactions.forEach((t) => {
    const current = categoryMap.get(t.category) || 0
    categoryMap.set(t.category, current + t.amount)
  })

  const totalAmount = response.total_amount || transactions.reduce((sum, t) => sum + t.amount, 0)
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    items: transactions,
    totals: {
      total: totalAmount,
      count: response.total || transactions.length,
    },
    breakdown,
  }
}

// API Response types for income endpoint (same structure as expenses)
interface ApiIncome {
  uuid: string
  datetime: string
  year: number
  month: number
  type: string
  amount: number
  amount_cents: number
  currency: string
  category: string
  description: string
  affects_liquidity: number
}

interface ApiIncomeResponse {
  year: number
  month: number
  currency: string
  total: number
  total_amount: number
  total_amount_cents: number
  income: ApiIncome[]
}

/**
 * GET /income
 * Returns list of income for a specific month
 */
export async function fetchMonthlyIncome(year: number, month: number): Promise<MonthlyListResponse<Transaction>> {
  const params = buildParams({ year, month })
  const response = await fetchApi<ApiIncomeResponse>(`/income?${params}`)
  
  // Map API response to frontend format
  const transactions: Transaction[] = response.income.map((income) => ({
    uuid: income.uuid,
    date: income.datetime,
    amount: income.amount,
    currency: income.currency,
    category: income.category,
    description: income.description,
    type: 'INGRESO' as TransactionType,
  }))

  // Calculate breakdown by category
  const categoryMap = new Map<string, number>()
  transactions.forEach((t) => {
    const current = categoryMap.get(t.category) || 0
    categoryMap.set(t.category, current + t.amount)
  })

  const totalAmount = response.total_amount || transactions.reduce((sum, t) => sum + t.amount, 0)
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    items: transactions,
    totals: {
      total: totalAmount,
      count: response.total || transactions.length,
    },
    breakdown,
  }
}

// API Response types for savings endpoint (same structure as expenses)
interface ApiSaving {
  uuid: string
  datetime: string
  year: number
  month: number
  type: string
  amount: number
  amount_cents: number
  currency: string
  category: string
  description: string
  affects_liquidity: number
}

interface ApiSavingsResponse {
  year: number
  month: number
  currency: string
  total: number
  total_amount: number
  total_amount_cents: number
  total_ars?: number
  total_ars_cents?: number
  total_usd?: number
  total_usd_cents?: number
  savings: ApiSaving[]
}

export interface MonthlySavingsResponse extends MonthlyListResponse<Transaction> {
  total_ars: number
  total_usd: number
  items_ars: Transaction[]
  items_usd: Transaction[]
}

/**
 * GET /savings
 * Returns list of savings for a specific month
 */
export async function fetchMonthlySavings(year: number, month: number): Promise<MonthlySavingsResponse> {
  const params = buildParams({ year, month })
  const response = await fetchApi<ApiSavingsResponse>(`/savings?${params}`)
  
  // Map API response to frontend format
  const transactions: Transaction[] = response.savings.map((saving) => ({
    uuid: saving.uuid,
    date: saving.datetime,
    amount: saving.amount,
    currency: saving.currency,
    category: saving.category,
    description: saving.description,
    type: 'AHORRO' as TransactionType,
  }))

  // Filter by currency
  const savingsARS = transactions.filter(s => s.currency === 'ARS')
  const savingsUSD = transactions.filter(s => s.currency === 'USD')

  // Get totals from API or calculate
  const totalARS = response.total_ars ?? savingsARS.reduce((sum, s) => sum + s.amount, 0)
  const totalUSD = response.total_usd ?? savingsUSD.reduce((sum, s) => sum + s.amount, 0)

  // Calculate breakdown by category (for all savings)
  const categoryMap = new Map<string, number>()
  transactions.forEach((t) => {
    const current = categoryMap.get(t.category) || 0
    categoryMap.set(t.category, current + t.amount)
  })

  const totalAmount = response.total_amount || transactions.reduce((sum, t) => sum + t.amount, 0)
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    items: transactions,
    items_ars: savingsARS,
    items_usd: savingsUSD,
    totals: {
      total: totalAmount,
      count: response.total || transactions.length,
    },
    breakdown,
    total_ars: totalARS,
    total_usd: totalUSD,
  }
}

// API Response types for annual endpoints
interface ApiAnnualMonthData {
  month: number
  total: number
  total_cents: number
}

interface ApiAnnualCategoryData {
  category: string
  month: number
  total: number
  total_cents: number
}

interface ApiAnnualGridItem {
  category: string
  months: ApiAnnualMonthData[]
}

interface ApiAnnualExpensesResponse {
  year: number
  currency: string
  format: string
  data: ApiAnnualCategoryData[]
  grid: ApiAnnualGridItem[]
}

interface ApiAnnualIncomeResponse {
  year: number
  currency: string
  format: string
  data: ApiAnnualCategoryData[]
  grid: ApiAnnualGridItem[]
}

interface ApiAnnualSavingsResponse {
  year: number
  currency: string
  format: string
  data: ApiAnnualCategoryData[]
  grid: ApiAnnualGridItem[]
}

/**
 * GET /annual/expenses
 * Returns annual expenses summary for a specific year
 */
export async function fetchAnnualExpenses(year: number): Promise<ApiAnnualExpensesResponse> {
  const params = buildParams({ year })
  return fetchApi<ApiAnnualExpensesResponse>(`/annual/expenses?${params}`)
}

/**
 * GET /annual/income
 * Returns annual income summary for a specific year
 */
export async function fetchAnnualIncome(year: number): Promise<ApiAnnualIncomeResponse> {
  const params = buildParams({ year })
  return fetchApi<ApiAnnualIncomeResponse>(`/annual/income?${params}`)
}

/**
 * GET /annual/savings
 * Returns annual savings summary for a specific year
 */
export async function fetchAnnualSavings(year: number): Promise<ApiAnnualSavingsResponse> {
  const params = buildParams({ year })
  return fetchApi<ApiAnnualSavingsResponse>(`/annual/savings?${params}`)
}

/**
 * Helper function to sum totals by month from annual API response
 */
function sumByMonth(data: ApiAnnualCategoryData[]): Map<number, number> {
  const monthMap = new Map<number, number>()
  
  // Initialize all 12 months with zeros
  for (let i = 1; i <= 12; i++) {
    monthMap.set(i, 0)
  }

  // Sum all totals by month
  if (data && Array.isArray(data)) {
    data.forEach((item) => {
      const existing = monthMap.get(item.month) || 0
      monthMap.set(item.month, existing + (item.total || 0))
    })
  }

  return monthMap
}

/**
 * GET /annual/summary
 * Returns annual summary for a specific year (combines expenses, income, savings)
 */
export async function fetchAnnualSummary(year: number): Promise<AnnualSummary> {
  let expensesData: ApiAnnualExpensesResponse
  let incomeData: ApiAnnualIncomeResponse
  let savingsData: ApiAnnualSavingsResponse

  try {
    [expensesData, incomeData, savingsData] = await Promise.all([
      fetchAnnualExpenses(year),
      fetchAnnualIncome(year),
      fetchAnnualSavings(year),
    ])
  } catch (error) {
    console.error('Error fetching annual data:', error)
    // Return empty structure if API fails
    expensesData = { year, currency: 'ARS', format: 'pivot', data: [], grid: [] }
    incomeData = { year, currency: 'ARS', format: 'pivot', data: [], grid: [] }
    savingsData = { year, currency: 'ARS', format: 'pivot', data: [], grid: [] }
  }

  // Sum expenses, income, and savings by month
  const expensesByMonth = sumByMonth(expensesData.data || [])
  const incomeByMonth = sumByMonth(incomeData.data || [])
  const savingsByMonth = sumByMonth(savingsData.data || [])

  // Convert to MonthlyRow array
  const months: MonthlyRow[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const expenses = expensesByMonth.get(month) || 0
    const income = incomeByMonth.get(month) || 0
    const savings = savingsByMonth.get(month) || 0
    
    return {
      month,
      monthName: getMonthName(month),
      expenses,
      income,
      savings,
      balance: income - expenses + savings,
    }
  })

  // Calculate totals
  const totals = {
    expenses: months.reduce((sum, m) => sum + m.expenses, 0),
    income: months.reduce((sum, m) => sum + m.income, 0),
    savings: months.reduce((sum, m) => sum + m.savings, 0),
    balance: 0,
  }
  totals.balance = totals.income - totals.expenses + totals.savings

  return {
    year,
    months,
    totals,
  }
}

/**
 * GET /networth
 * Returns net worth snapshot
 * Optional: year/month for historical snapshot
 */
export async function fetchNetWorth(year?: number, month?: number): Promise<NetWorthSnapshot> {
  const params = year && month ? `?${buildParams({ year, month })}` : ''
  // TODO: Uncomment when backend is ready
  // return fetchApi<NetWorthSnapshot>(`/networth${params}`)
  
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/networth${params}`)
  throw new Error('Backend not implemented - use demo data')
}

/**
 * GET /evolution
 * Returns evolution data for charts
 * Requires year/month as anchor point and range
 */
export async function fetchEvolution(
  year: number, 
  month: number, 
  range: '6m' | '12m' | '24m'
): Promise<EvolutionSeries> {
  const params = buildParams({ year, month, range })
  // TODO: Uncomment when backend is ready
  // return fetchApi<EvolutionSeries>(`/evolution?${params}`)
  
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/evolution?${params}`)
  throw new Error('Backend not implemented - use demo data')
}

// Sync Response type
export interface SyncResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * POST /sync/syncDB
 * Synchronizes database data
 * @param inicio Start range (e.g., 'A')
 * @param fin End range (e.g., 'G')
 */
export async function syncDB(inicio: string = 'A', fin: string = 'G'): Promise<SyncResponse> {
  const params = buildParams({ inicio, fin })
  const response = await fetchApi<SyncResponse>(`/sync/syncDB?${params}`, {
    method: 'POST',
  })
  return response
}

/**
 * POST /resumes/syncResumes
 * Synchronizes resumes data
 */
export async function syncResumes(): Promise<SyncResponse> {
  const response = await fetchApi<SyncResponse>(`/resumes/syncResumes`, {
    method: 'POST',
  })
  return response
}

// Liquidity types
export interface LiquidityOpeningBalanceRequest {
  datetime: string
  currency: string
  amount: number
  description: string
}

export interface LiquidityCurrentResponse {
  currency: string
  opening_balance: number
  opening_balance_cents: number
  liquidity_transactions: number
  liquidity_transactions_cents: number
  current: number
  current_cents: number
}

/**
 * POST /liquidity/opening-balance
 * Adjusts liquidity opening balance
 */
export async function adjustLiquidity(data: LiquidityOpeningBalanceRequest): Promise<SyncResponse> {
  try {
    const response = await fetchApi<any>(`/liquidity/opening-balance`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Si la respuesta es exitosa (status 200), asumimos éxito
    // A menos que explícitamente tenga success: false
    if (response && typeof response === 'object') {
      return {
        success: response.success !== false,
        message: response.message,
        error: response.error,
      }
    }
    
    return { success: true, message: 'Ajuste realizado correctamente' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * GET /liquidity/current
 * Returns current liquidity
 */
export async function fetchCurrentLiquidity(): Promise<LiquidityCurrentResponse> {
  return fetchApi<LiquidityCurrentResponse>(`/liquidity/current`)
}

// Patrimonio types
export interface PatrimonioBitcoin {
  quantity: number
  datetime: string
}

export interface PatrimonioCedear {
  quantity: number
  datetime: string
}

export interface PatrimonioUsdItem {
  description: string
  value_usd: number
  value_usd_cents: number
  datetime: string
}

export interface PatrimonioUsdFisico {
  base: number
  base_cents: number
  ahorros: number
  ahorros_cents: number
  total: number
  total_cents: number
}

export interface PatrimonioResponse {
  bitcoin: PatrimonioBitcoin | null
  cedear: PatrimonioCedear | null
  patrimonio_usd: PatrimonioUsdItem[]
  usd_fisico: PatrimonioUsdFisico | null
}

export interface PatrimonioRequest {
  type: 'BITCOIN' | 'CEDEAR' | 'PATRIMONIO_USD' | 'USD_FISICO'
  quantity?: number
  value_usd?: string
  description?: string
  datetime?: string
  active?: boolean
}

/**
 * GET /patrimonio
 * Returns patrimonio data
 */
export async function fetchPatrimonio(): Promise<PatrimonioResponse> {
  return fetchApi<PatrimonioResponse>(`/patrimonio`)
}

/**
 * POST /patrimonio
 * Creates or updates patrimonio
 */
export async function savePatrimonio(data: PatrimonioRequest): Promise<SyncResponse> {
  try {
    const response = await fetchApi<any>(`/patrimonio`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Si la respuesta es exitosa (status 200), asumimos éxito
    if (response && typeof response === 'object') {
      return {
        success: response.success !== false,
        message: response.message,
        error: response.error,
      }
    }
    
    return { success: true, message: 'Patrimonio guardado correctamente' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

// Balanz API types
export interface BalanzEstadoCuentaResponse {
  // TODO: Definir estructura según respuesta real de la API
  [key: string]: any
}

/**
 * GET Balanz Estado de Cuenta API (via backend proxy)
 * Consulta el estado de cuenta de Balanz usando Basic Auth
 * La petición se hace a través del backend para evitar problemas de CORS
 * @param fecha Formato YYYYMMDD (ej: 20260124)
 * @param ta Tipo de cuenta (default: 1)
 * @param idMoneda ID de moneda (default: 1)
 * @param cuentaId ID de cuenta (default: 1179229)
 */
export async function fetchBalanzEstadoCuenta(
  fecha: string,
  ta: number = 1,
  idMoneda: number = 1,
  cuentaId: number = 1179229
): Promise<BalanzEstadoCuentaResponse> {
  // Llamar al endpoint proxy del backend en lugar de directamente a Balanz
  const params = buildParams({ fecha, ta, idMoneda, cuentaId })
  const url = `${API_BASE_URL}/balanz/estadodecuenta?${params}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Balanz API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data
}

// CEDEAR SPY500 types
export interface CedearSpyResponse {
  item: number
  ticker: string
  description: string
  lastPrice: number
  variation: number
  amountPurchase: number
  pricePurchase: number
  amountSale: number
  priceSale: number
  volumen: number
  opening: number
  minDay: number
  maxDay: number
  previousClosing: number
  lastQuote: string
  term: {
    id: number
  }
  isAuction: boolean
  ratio: number
  currency: {
    id: number
  }
  expirationDate: string
  modifiedDuration: number
  tir: number
  key: string
  image: string
  detailsHref: string
  operateHref: string
}

/**
 * GET /cedears/spy
 * Returns current SPY500 CEDEAR price
 */
export async function fetchCedearSpy(): Promise<CedearSpyResponse> {
  return fetchApi<CedearSpyResponse>(`/cedears/spy`)
}

// Card Statement types
export interface CardConsumo {
  importe: number
  importe_cents: number
  holder: string
  descripcion: string
  fecha: string
  is_cuota: boolean
}

export interface CardStatementsResponse {
  year: number
  month: number
  total_cuotas: number
  total_cuotas_cents: number
  total_pagos_unicos: number
  total_pagos_unicos_cents: number
  conversion_amount: number
  total_visa: number
  total_visa_cents: number
  total_mastercard: number
  total_mastercard_cents: number
  total_cuotas_visa: number
  total_cuotas_visa_cents: number
  total_cuotas_mastercard: number
  total_cuotas_mastercard_cents: number
  total_pagos_unicos_visa: number
  total_pagos_unicos_visa_cents: number
  total_pagos_unicos_mastercard: number
  total_pagos_unicos_mastercard_cents: number
  consumos: {
    visa: CardConsumo[]
    mastercard: CardConsumo[]
  }
}

export interface CardCategory {
  categoria: string
  total: number
  total_cents: number
}

export interface CardCategoriesResponse {
  year: number
  month: number
  categories: CardCategory[]
}

export interface CardAnnualMonth {
  month: number
  total: number
  total_cents: number
  total_visa: number
  total_visa_cents: number
  total_mastercard: number
  total_mastercard_cents: number
}

export interface CardAnnualResponse {
  year: number
  total: number
  total_cents: number
  total_visa: number
  total_visa_cents: number
  total_mastercard: number
  total_mastercard_cents: number
  months: CardAnnualMonth[]
}

/**
 * GET /cards/statements
 * Returns card statements for a specific month
 */
export async function fetchCardStatements(year: number, month: number): Promise<CardStatementsResponse> {
  const params = buildParams({ year, month })
  return fetchApi<CardStatementsResponse>(`/cards/statements?${params}`)
}

/**
 * GET /cards/statements/categories
 * Returns card statements categories for a specific month
 */
export async function fetchCardCategories(year: number, month: number): Promise<CardCategoriesResponse> {
  const params = buildParams({ year, month })
  return fetchApi<CardCategoriesResponse>(`/cards/statements/categories?${params}`)
}

/**
 * GET /cards/statements/annual
 * Returns annual card statements summary
 */
export async function fetchCardAnnual(year: number): Promise<CardAnnualResponse> {
  const params = buildParams({ year })
  return fetchApi<CardAnnualResponse>(`/cards/statements/annual?${params}`)
}
