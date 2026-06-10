import { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export default function ScannerWidget({ onScan }: { onScan: (barcode: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader-widget'

  useEffect(() => {
    return () => { stopScanner() }
  }, [])

  const startScanner = async () => {
    setCameraError(null)
    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner
      setIsScanning(true)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => { onScan(decodedText) },
        () => {}
      )
    } catch (err: any) {
      setCameraError(err?.message || 'Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const toggle = () => {
    if (isOpen) { stopScanner(); setIsOpen(false) }
    else { setIsOpen(true); setTimeout(startScanner, 200) }
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
        <span className="flex items-center gap-2"><Camera size={16} className="text-muted-foreground" />Webcam Scanner</span>
        <span className="text-xs text-muted-foreground">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-border">
          <div className="mt-3">
            <div id={containerId} className="w-full aspect-square bg-background rounded-lg overflow-hidden" />
            {cameraError && <p className="text-xs text-destructive mt-2">{cameraError}</p>}
            {!isScanning && !cameraError && (
              <button onClick={startScanner} className="w-full mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Start Camera</button>
            )}
            {isScanning && (
              <button onClick={stopScanner} className="w-full mt-2 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"><CameraOff size={14} className="inline mr-1" /> Stop</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
