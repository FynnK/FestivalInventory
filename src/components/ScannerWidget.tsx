import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { useI18n } from '../i18n'

export default function ScannerWidget({ onScan }: { onScan: (barcode: string) => void }) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const containerId = 'qr-reader-widget'

  useEffect(() => {
    return () => { stopScanner() }
  }, [])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanner = useCallback(async () => {
    setCameraError(null)
    try {
      if (!containerRef.current) {
        setCameraError('Camera container not ready')
        return
      }

      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        setCameraError('No cameras found on this device')
        setIsScanning(false)
        return
      }

      setIsScanning(true)

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => { onScan(decodedText) },
          () => {}
        )
      } catch {
        if (cameras.length > 0) {
          await scanner.start(
            cameras[0].id,
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            (decodedText) => { onScan(decodedText) },
            () => {}
          )
        } else {
          throw new Error('No working camera found')
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err) || t('scanner_error_start_failed')
      if (msg.includes('Permission') || msg.includes('permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.')
        setIsPermissionDenied(true)
      } else if (msg.includes('NotFound') || msg.includes('not found') || msg.includes('No cameras')) {
        setCameraError('No camera found on this device.')
      } else {
        setCameraError(msg)
      }
      setIsScanning(false)
    }
  }, [onScan, t])

  const requestPermission = useCallback(async () => {
    setIsPermissionDenied(false)
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      startScanner()
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('Permission') || msg.includes('permission') || msg.includes('NotAllowed')) {
        setIsPermissionDenied(true)
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.')
      } else {
        setCameraError(msg)
      }
    }
  }, [startScanner])

  const toggle = () => {
    if (isOpen) {
      stopScanner()
      setIsOpen(false)
    } else {
      setIsOpen(true)
      setCameraError(null)
    }
  }

  useEffect(() => {
    if (isOpen && !isScanning && !cameraError) {
      const timer = setTimeout(startScanner, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
        <span className="flex items-center gap-2"><Camera size={16} className="text-muted-foreground" />{t('scanner_heading')}</span>
        <span className="text-xs text-muted-foreground">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-border">
          <div className="mt-3">
            <div ref={containerRef} id={containerId} className="w-full aspect-square bg-background rounded-lg overflow-hidden" />
            {cameraError && <p className="text-xs text-destructive mt-2">{cameraError}</p>}
            {!isScanning && !cameraError && !isPermissionDenied && (
              <button onClick={startScanner} className="w-full mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">{t('scanner_start_camera_button')}</button>
            )}
            {isPermissionDenied && (
              <button onClick={requestPermission} className="w-full mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">{t('scanner_request_permission_button')}</button>
            )}
            {isScanning && (
              <button onClick={stopScanner} className="w-full mt-2 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"><CameraOff size={14} className="inline mr-1" /> {t('scanner_stop_button')}</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
