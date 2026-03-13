import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Landing } from '@/pages/Landing'
import { Dashboard } from '@/pages/Dashboard'
import { CommandPalette } from '@/components/CommandPalette'
import { useLayoutStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'

function AppInner() {
  const toggleLock = useLayoutStore((s) => s.toggleLock)

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
        document.documentElement.classList.toggle('dark')
      } else if (e.key === 'L' || e.key === 'l') {
        toggleLock()
      } else if (e.key === 'R' || e.key === 'r') {
        window.dispatchEvent(new CustomEvent('monoth:refresh-all'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleLock])

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/symbol/:ticker" element={<Dashboard />} />
      </Routes>
      <CommandPalette />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ThemeProvider>
  )
}
