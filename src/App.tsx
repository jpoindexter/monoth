import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/Toast'
import { Landing } from '@/pages/Landing'
import { Dashboard } from '@/pages/Dashboard'
import { CommandPalette } from '@/components/CommandPalette'
import { KeyboardHelp } from '@/components/KeyboardHelp'
import { useLayoutStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'
import { useTheme } from '@/components/theme-provider'
import { useAlertChecker } from '@/hooks/use-alert-checker'

function AppInner() {
  const toggleLock = useLayoutStore((s) => s.toggleLock)
  const { theme, setTheme } = useTheme()
  useAlertChecker()

  useEffect(() => {
    useUserStore.getState().initAuth()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === '/') {
        e.preventDefault()
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
      } else if (e.key === 'D' || e.key === 'd') {
        setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')
      } else if (e.key === 'L' || e.key === 'l') {
        toggleLock()
      } else if (e.key === 'R' || e.key === 'r') {
        window.dispatchEvent(new CustomEvent('monoth:refresh-all'))
        window.dispatchEvent(new CustomEvent('monoth:toast', { detail: 'Refreshing all panels...' }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleLock, theme, setTheme])

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/symbol/:ticker" element={<Dashboard />} />
      </Routes>
      <CommandPalette />
      <KeyboardHelp />
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
        <Analytics />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
