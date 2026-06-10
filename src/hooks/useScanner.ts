import { useEffect, useRef, useCallback } from 'react'

const SCANNER_MIN_LENGTH = 3

export function useScanner(onScan: (barcode: string) => void, enabled = true): void {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBuffer = useCallback(() => {
    const barcode = bufferRef.current.trim()
    if (barcode.length >= SCANNER_MIN_LENGTH) {
      onScan(barcode)
    }
    bufferRef.current = ''
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        flushBuffer()
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        return
      }

      if (e.key.length === 1) {
        const now = Date.now()
        const elapsed = now - lastKeyTimeRef.current

        if (elapsed > 100 && bufferRef.current.length > 0) {
          bufferRef.current = ''
        }

        bufferRef.current += e.key
        lastKeyTimeRef.current = now

        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(flushBuffer, 200)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, flushBuffer])
}
