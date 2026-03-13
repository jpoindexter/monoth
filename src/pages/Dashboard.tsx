import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SymbolDetailSheet } from '@/components/SymbolDetailSheet'

export function Dashboard() {
  const { ticker } = useParams<{ ticker: string }>()
  const [sheetOpen, setSheetOpen] = useState(!!ticker)

  useEffect(() => {
    if (ticker) setSheetOpen(true)
  }, [ticker])

  return (
    <>
      <DashboardLayout />
      {ticker && (
        <SymbolDetailSheet
          ticker={ticker}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
