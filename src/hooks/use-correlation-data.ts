import { usePolling } from './use-polling'
import { fetchCorrelationEvents, fetchCorrelationMatrix } from '@/services/api/correlation'

export function useCorrelationEvents(interval = 300_000) {
  return usePolling({ fetcher: fetchCorrelationEvents, interval })
}

export function useCorrelationMatrix(interval = 3_600_000) {
  return usePolling({ fetcher: fetchCorrelationMatrix, interval })
}
