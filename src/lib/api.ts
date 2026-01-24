import type {
  MonthlySummary,
  MonthlyListResponse,
  Transaction,
  AnnualSummary,
  NetWorthSnapshot,
  EvolutionSeries,
} from '@/src/types/finance'

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

// Toggle for demo mode - set to false when backend is ready
export const USE_DEMO_DATA = true

// Generic fetch wrapper with error handling
// TODO: Add authentication headers when auth is implemented
// Example: headers: { 'Authorization': `Bearer ${token}` }
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
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
 * Returns dashboard summary for a specific month
 */
export async function fetchMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const params = buildParams({ year, month })
  // TODO: Uncomment when backend is ready
  // return fetchApi<MonthlySummary>(`/monthly/summary?${params}`)
  
  // Placeholder - this fetch is ready to use
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/monthly/summary?${params}`)
  throw new Error('Backend not implemented - use demo data')
}

/**
 * GET /monthly/expenses
 * Returns list of expenses for a specific month
 */
export async function fetchMonthlyExpenses(year: number, month: number): Promise<MonthlyListResponse<Transaction>> {
  const params = buildParams({ year, month })
  // TODO: Uncomment when backend is ready
  // return fetchApi<MonthlyListResponse<Transaction>>(`/monthly/expenses?${params}`)
  
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/monthly/expenses?${params}`)
  throw new Error('Backend not implemented - use demo data')
}

/**
 * GET /monthly/income
 * Returns list of income for a specific month
 */
export async function fetchMonthlyIncome(year: number, month: number): Promise<MonthlyListResponse<Transaction>> {
  const params = buildParams({ year, month })
  // TODO: Uncomment when backend is ready
  // return fetchApi<MonthlyListResponse<Transaction>>(`/monthly/income?${params}`)
  
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/monthly/income?${params}`)
  throw new Error('Backend not implemented - use demo data')
}

/**
 * GET /monthly/savings
 * Returns list of savings for a specific month
 */
export async function fetchMonthlySavings(year: number, month: number): Promise<MonthlyListResponse<Transaction>> {
  const params = buildParams({ year, month })
  // TODO: Uncomment when backend is ready
  // return fetchApi<MonthlyListResponse<Transaction>>(`/monthly/savings?${params}`)
  
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/monthly/savings?${params}`)
  throw new Error('Backend not implemented - use demo data')
}

/**
 * GET /annual/summary
 * Returns annual summary for a specific year
 */
export async function fetchAnnualSummary(year: number): Promise<AnnualSummary> {
  const params = buildParams({ year })
  // TODO: Uncomment when backend is ready
  // return fetchApi<AnnualSummary>(`/annual/summary?${params}`)
  
  console.log(`[API] Would fetch: GET ${API_BASE_URL}/annual/summary?${params}`)
  throw new Error('Backend not implemented - use demo data')
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
