import { useState, useRef, useCallback, useEffect } from 'react'

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
  const onMessageRef = useRef<((msg: { type: string; payload: any }) => void) | null>(null)

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const setOnMessage = useCallback((handler: ((msg: { type: string; payload: any }) => void) | null) => {
    onMessageRef.current = handler
  }, [])

  const send = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  const readEventData = useCallback((event: MessageEvent): string => {
    if (typeof event.data === 'string') return event.data
    if (event.data instanceof ArrayBuffer) return new TextDecoder().decode(event.data)
    if (event.data instanceof Blob) return '' // should not happen with text frames
    return ''
  }, [])

  const startHosting = useCallback((ip: string, port: string, onBarcode: (barcode: string) => void) => {
    cleanup()
    onBarcodeRef.current = onBarcode
    const roomId = generateRoomId()
    setState({ status: 'connecting', roomId, relayIp: ip, error: null })

    const ws = new WebSocket(`ws://127.0.0.1:${port}?room=${roomId}&role=desktop`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[Desktop] WebSocket connected to relay, room:', roomId)
      setState({ status: 'connected', roomId, relayIp: ip, error: null })
    }
    ws.onerror = () => {
      console.error('[Desktop] WebSocket connection error')
      setState({ status: 'error', roomId, relayIp: ip, error: 'WebSocket connection failed.' })
    }
    ws.onclose = () => {
      wsRef.current = null
      setState({ status: 'idle', roomId: null, relayIp: null, error: null })
    }
    ws.onmessage = (event) => {
      try {
        const text = readEventData(event)
        const msg = JSON.parse(text)
        if (msg.type === 'BARCODE') {
          console.log('[Desktop] received barcode via WebSocket:', msg.payload)
          onBarcodeRef.current?.(msg.payload)
        } else {
          onMessageRef.current?.(msg)
        }
      } catch (e) {
        console.error('[Desktop] failed to process remote message:', e)
      }
    }
  }, [cleanup, readEventData])

  const stopHosting = useCallback(() => {
    cleanup()
    setState({ status: 'idle', roomId: null, relayIp: null, error: null })
  }, [cleanup])

  const connectToHost = useCallback((ip: string, port: string, roomId: string) => {
    cleanup()
    let timedOut = false
    setState({ status: 'connecting', roomId, relayIp: ip, error: null })
    console.log('[Phone] connecting to relay at', ip, port, 'room:', roomId)

    const ws = new WebSocket(`ws://${ip}:${port}?room=${roomId}&role=phone`)
    wsRef.current = ws
    const timeout = setTimeout(() => {
      timedOut = true
      ws.close()
      setState({ status: 'error', roomId, relayIp: ip, error: 'Connection timed out.' })
    }, 10000)

    ws.onopen = () => {
      clearTimeout(timeout)
      console.log('[Phone] WebSocket connected to relay')
      setState({ status: 'connected', roomId, relayIp: ip, error: null })
    }
    ws.onerror = () => {
      clearTimeout(timeout)
      console.error('[Phone] WebSocket connection error')
      setState({ status: 'error', roomId, relayIp: ip, error: 'Connection failed.' })
    }
    ws.onclose = () => {
      clearTimeout(timeout)
      wsRef.current = null
      if (!timedOut) {
        setState({ status: 'idle', roomId: null, relayIp: null, error: null })
      }
    }
    ws.onmessage = (event) => {
      try {
        const text = readEventData(event)
        const msg = JSON.parse(text)
        onMessageRef.current?.(msg)
      } catch (e) {
        console.error('[Phone] failed to process message:', e)
      }
    }
  }, [cleanup, readEventData])

  const disconnect = useCallback(() => {
    cleanup()
    setState({ status: 'idle', roomId: null, relayIp: null, error: null })
  }, [cleanup])

  const sendBarcode = useCallback((barcode: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Phone] sending barcode:', barcode)
      wsRef.current.send(JSON.stringify({ type: 'BARCODE', payload: barcode }))
    } else {
      console.warn('[Phone] cannot send barcode — WebSocket not open, state:', wsRef.current?.readyState)
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  return { state, startHosting, stopHosting, connectToHost, disconnect, sendBarcode, send, setOnMessage, generateRoomId }
}
