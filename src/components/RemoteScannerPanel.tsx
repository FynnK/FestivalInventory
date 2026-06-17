import { useState, useEffect, useRef } from 'react'
import { Smartphone, WifiOff, ScanLine } from 'lucide-react'
import QRCode from 'qrcode'
import { useI18n } from '../i18n'
import type { PeerStatus } from '../hooks/usePeerSync'

const RELAY_PORT = 3001

export default function RemoteScannerPanel({
  status,
  roomId,
  relayIp,
  onStart,
  onStop,
}: {
  status: PeerStatus
  roomId: string | null
  relayIp: string | null
  onStart: (ip: string) => void
  onStop: () => void
}) {
  const { t } = useI18n()
  const [ipInput, setIpInput] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const isIdle = status === 'idle'
  const isConnected = status === 'connected'

  const connectionUrl = relayIp && roomId
    ? `${window.location.origin}/?remote=${relayIp}:${RELAY_PORT}#${roomId}`
    : null

  useEffect(() => {
    if (connectionUrl) {
      QRCode.toDataURL(connectionUrl, { width: 200, margin: 2 })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  }, [connectionUrl])

  const handleToggle = () => {
    if (!isIdle) { onStop(); return }
    if (!ipInput.trim()) return
    onStart(ipInput.trim())
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {isIdle ? (
        <div className="p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Smartphone size={14} /> {t('remote_scanner_heading')}
          </p>
          <p className="text-xs text-muted-foreground">{t('remote_scanner_enter_ip')}</p>
          <input
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="192.168.1.50"
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            onKeyDown={(e) => { if (e.key === 'Enter') handleToggle() }}
          />
          <button onClick={handleToggle}
            disabled={!ipInput.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
            <ScanLine size={14} /> {t('remote_scanner_start_button')}
          </button>
        </div>
      ) : (
        <>
          <button onClick={handleToggle}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isConnected
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Smartphone size={16} />
              {t('remote_scanner_heading')}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              isConnected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
            }`}>
              {isConnected ? t('remote_scanner_connected') : t('remote_scanner_waiting')}
            </span>
          </button>
          {qrDataUrl && (
            <div className="px-3 pb-3 border-t border-border">
              <div className="mt-3 flex flex-col items-center gap-2">
                <img src={qrDataUrl} alt="Connection QR code" className="rounded-lg" />
                <p className="text-xs text-muted-foreground font-mono">{roomId}</p>
                <p className="text-xs text-muted-foreground text-center">
                  {isConnected
                    ? t('remote_scanner_phone_connected')
                    : t('remote_scanner_scan_instruction')}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
