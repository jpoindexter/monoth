import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/stores/user-store'

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREE_FEATURES = [
  '5-15 min data refresh',
  'Bring your own AI key',
  '5 symbol watchlist',
  'Basic layout',
]

const PRO_FEATURES = [
  '<60s data refresh',
  'AI included',
  'Unlimited watchlist',
  'Saved layouts',
  'Correlation depth',
  'Price alerts',
]

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [loading, setLoading] = useState(false)
  const session = useUserStore((s) => s.session)
  const tier = useUserStore((s) => s.tier)

  async function handleUpgrade() {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    const customerId = (session?.user?.user_metadata?.stripe_customer_id as string) ?? ''
    if (!customerId) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plans</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Free</span>
              <Badge variant="secondary">Current</Badge>
            </div>
            <p className="text-2xl font-bold">$0</p>
            <Separator />
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-muted-foreground">-</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-primary p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Pro</span>
              {tier === 'pro' && <Badge>Active</Badge>}
            </div>
            <p className="text-2xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <Separator />
            <ul className="space-y-1.5 text-sm">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-primary">+</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-2">
          {tier === 'pro' ? (
            <Button variant="outline" className="w-full" onClick={handlePortal} disabled={loading}>
              {loading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleUpgrade} disabled={loading || !session}>
              {loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </Button>
          )}
          {!session && (
            <p className="text-xs text-muted-foreground text-center mt-2">Sign in to upgrade</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
