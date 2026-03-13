import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchCryptoPrices } from '@/services/api'
import { useMarketStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'

export function useCryptoData(customInterval?: number) {
  const tier = useUserStore((s) => s.tier)
  const interval = customInterval ?? (tier === 'pro' ? 30_000 : 300_000)
  const setCrypto = useMarketStore((s) => s.setCrypto)
  const fetcher = useCallback(async () => {
    const data = await fetchCryptoPrices()
    setCrypto(data)
    return data
  }, [setCrypto])

  return usePolling({ fetcher, interval })
}
