import { useState, useRef, useCallback, useEffect } from 'react'

const RELAY_PORT = 3001
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export type PeerStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface PeerState {
  status: PeerStatus
  roomId: string | null
  relayIp: string | null
  error: string | null
}

function generateRoomId() {
  let result = ''
  for (let i = 0; i < 6; i++)
    result += ROOM_CHARS.charAt(Math.floor(Math.random() * ROOM_CHARS.length))
  return result
}

export function usePeerSync() {
  const [state, setState] = useState<PeerState>({ status: 'idle', roomId: null, relayIp: null, error: null })
  const wsRef = useRef<WebSocket | null>(null)
  const onBarcodeRef = useRef<((barcode: string) => void) | null>(null)

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const startHosting = useCallback((ip: string, onBarcode: (barcode: string) => void) => {
    cleanup()
    onBarcodeRef.current = onBarcode
    const roomId = generateRoomId()
    setState({ status: 'connecting', roomId, relayIp: ip, error: null })

    const ws = new WebSocket(`ws://127.0.0.1:${RELAY_PORT}?room=${roomId}&role=desktop`)
    wsRef.current = ws

    ws.onopen = () => setState({ status: 'connected', roomId, relayIp: ip, error: null })
    ws.onerror = () => setState({ status: 'error', roomId, relayIp: ip, error: 'WebSocket connection failed.' })
    ws.onclose = () => {
      wsRef.current = null
      setState({ status: 'idle', roomId: null, relayIp: null, error: null })
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'BARCODE') onBarcodeRef.current?.(msg.payload)
      } catch {}
    }
  }, [cleanup])

  const stopHosting = useCallback(() => {
    cleanup()
    setState({ status: 'idle', roomId: null, relayIp: null, error: null })
  }, [cleanup])

  const connectToHost = useCallback((ip: string, port: string, roomId: string) => {
    cleanup()
    let timedOut = false
    setState({ status: 'connecting', roomId, relayIp: ip, error: null })

    const ws = new WebSocket(`ws://${ip}:${port}?room=${roomId}&role=phone`)
    wsRef.current = ws
    const timeout = setTimeout(() => {
      timedOut = true
      ws.close()
      setState({ status: 'error', roomId, relayIp: ip, error: 'Connection timed out.' })
    }, 10000)

    ws.onopen = () => {
      clearTimeout(timeout)
      setState({ status: 'connected', roomId, relayIp: ip, error: null })
    }
    ws.onerror = () => {
      clearTimeout(timeout)
      setState({ status: 'error', roomId, relayIp: ip, error: 'Connection failed.' })
    }
    ws.onclose = () => {
      clearTimeout(timeout)
      wsRef.current = null
      if (!timedOut) {
        setState({ status: 'idle', roomId: null, relayIp: null, error: null })
      }
    }
  }, [cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setState({ status: 'idle', roomId: null, relayIp: null, error: null })
  }, [cleanup])

  const sendBarcode = useCallback((barcode: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'BARCODE', payload: barcode }))
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  return { state, startHosting, stopHosting, connectToHost, disconnect, sendBarcode, generateRoomId }
}
