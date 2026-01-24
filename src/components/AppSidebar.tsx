'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  CalendarDays,
  TrendingUp,
  LineChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/monthly/expenses', label: 'Gastos', icon: Receipt },
  { href: '/monthly/income', label: 'Ingresos', icon: Wallet },
  { href: '/monthly/savings', label: 'Ahorros', icon: PiggyBank },
  { href: '/annual', label: 'Anual', icon: CalendarDays },
  { href: '/networth', label: 'Patrimonio', icon: TrendingUp },
  { href: '/evolution', label: 'Evolución', icon: LineChart },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar min-h-screen">
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-sm">FN</span>
          </div>
          <span className="font-semibold text-lg">Finanzas</span>
        </Link>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          Demo Mode
        </div>
      </div>
    </aside>
  )
}
