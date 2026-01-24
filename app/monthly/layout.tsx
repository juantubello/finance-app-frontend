import { AppLayout } from '@/src/components/AppLayout'
import { ReactNode } from 'react'

export default function MonthlyLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
