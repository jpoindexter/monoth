import { useEffect, useRef, useState } from 'react'

interface FlashValueProps {
  value: string | number
  className?: string
}

export function FlashValue({ value, className = '' }: FlashValueProps) {
  const prevRef = useRef(value)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <span
      className={`${className} transition-colors duration-600 ${flash ? 'text-sky-400' : ''}`}
    >
      {value}
    </span>
  )
}
