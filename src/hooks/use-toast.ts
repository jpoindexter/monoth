import { useCallback } from 'react'

/** Returns a function that fires a transient toast via the global toast event. */
export function useToast() {
  return useCallback((message: string) => {
    window.dispatchEvent(new CustomEvent('monoth:toast', { detail: message }))
  }, [])
}
