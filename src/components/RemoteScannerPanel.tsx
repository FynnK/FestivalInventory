import { useState, useEffect, useRef } from 'react'
import { Smartphone, WifiOff } from 'lucide-react'
import QRCode from 'qrcode'
import { useI18n } from '../i18n'
import type { PeerStatus } from '../hooks/usePeerSync'

export default function RemoteScannerPanel({
  status,
  peerId,
  onStart,
  onStop,
}: {
  status: PeerStatus
  peerId: string | null
  onStart: () => void
  onStop: () => void
}) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const isHosting = status === 'hosting' || status === 'connected'
  const isConnected = status === 'connected'

  const connectionUrl = peerId ? `${window.location.origin}/?remote=${peerId}` : null

  useEffect(() => {
    if (connectionUrl) {
      QRCode.toDataURL(connectionUrl, { width: 200, margin: 2 })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  }, [connectionUrl])

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={isHosting ? onStop : onStart}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium transition-colors ${
          isHosting
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'text-foreground hover:bg-accent'
        }`}
      >
        <span className="flex items-center gap-2">
          {isHosting ? <Smartphone size={16} /> : <WifiOff size={16} />}
          {t('remote_scanner_heading')}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold ${
            isHosting
              ? isConnected
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-black'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isHosting
            ? isConnected
              ? t('remote_scanner_connected')
              : t('remote_scanner_waiting')
            : t('remote_scanner_off')}
        </span>
      </button>
      {isHosting && qrDataUrl && (
        <div className="px-3 pb-3 border-t border-border">
          <div className="mt-3 flex flex-col items-center gap-2">
            <img src={qrDataUrl} alt="Connection QR code" className="rounded-lg" />
            <p className="text-xs text-muted-foreground font-mono">{peerId}</p>
            <p className="text-xs text-muted-foreground text-center">
              {isConnected
                ? t('remote_scanner_phone_connected')
                : t('remote_scanner_scan_instruction')}
            </p>
          </div>
        </div>
      )}
      {isHosting && !qrDataUrl && (
        <div className="px-3 pb-3 border-t border-border">
          <div className="mt-3 flex items-center justify-center py-4">
            <p className="text-xs text-muted-foreground">{t('remote_scanner_generating')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
