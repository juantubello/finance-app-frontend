import { AppLayout } from '@/src/components/AppLayout'
import { ReactNode } from 'react'

export default function SyncLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
