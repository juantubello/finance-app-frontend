'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarDays, TrendingUp } from 'lucide-react'

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/monthly/expenses', label: 'Gastos', icon: Receipt },
  { href: '/monthly/income', label: 'Ingresos', icon: Wallet },
  { href: '/monthly/savings', label: 'Ahorros', icon: PiggyBank },
]

const moreNavItems = [
  { href: '/annual', label: 'Anual', icon: CalendarDays },
  { href: '/networth', label: 'Patrimonio', icon: TrendingUp },
  { href: '/sync', label: 'Sincronizar', icon: RefreshCw },
]

export function MobileNav() {
  const pathname = usePathname()
  const isMoreActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-inset-bottom">
      <ul className="flex items-center justify-around h-16 pb-safe">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isMoreActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>Más</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mb-2">
              {moreNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  )
}
