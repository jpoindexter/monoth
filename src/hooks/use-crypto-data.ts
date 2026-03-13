import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchCryptoPrices } from '@/services/api'
import { useMarketStore } from '@/stores'

export function useCryptoData(interval = 300_000) {
  const setCrypto = useMarketStore((s) => s.setCrypto)
  const fetcher = useCallback(async () => {
    const data = await fetchCryptoPrices()
    setCrypto(data)
    return data
  }, [setCrypto])

  return usePolling({ fetcher, interval })
}
