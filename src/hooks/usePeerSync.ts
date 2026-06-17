import { useState, useRef, useCallback, useEffect } from 'react'
import { Peer } from 'peerjs'

export type PeerStatus = 'idle' | 'hosting' | 'connecting' | 'connected' | 'error'

export interface PeerState {
  status: PeerStatus
  peerId: string | null
  error: string | null
}

export function usePeerSync() {
  const [state, setState] = useState<PeerState>({ status: 'idle', peerId: null, error: null })
  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<any>(null)
  const onBarcodeRef = useRef<((barcode: string) => void) | null>(null)

  const cleanup = useCallback(() => {
    if (connRef.current) {
      connRef.current.close()
      connRef.current = null
    }
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
  }, [])

  const generateId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 6; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    return result
  }

  const startHosting = useCallback((onBarcode: (barcode: string) => void) => {
    cleanup()
    onBarcodeRef.current = onBarcode
    const roomId = generateId()
    setState({ status: 'hosting', peerId: roomId, error: null })
    const peer = new Peer(roomId)
    peerRef.current = peer

    peer.on('connection', (conn) => {
      connRef.current = conn
      setState({ status: 'connected', peerId: roomId, error: null })
      conn.on('data', (data: any) => {
        if (typeof data === 'string') onBarcodeRef.current?.(data)
      })
      conn.on('close', () => {
        connRef.current = null
        setState({ status: 'hosting', peerId: roomId, error: null })
      })
    })

    peer.on('error', (err) => {
      setState({ status: 'error', peerId: roomId, error: err.message })
    })
  }, [cleanup])

  const stopHosting = useCallback(() => {
    cleanup()
    setState({ status: 'idle', peerId: null, error: null })
  }, [cleanup])

  const connectToHost = useCallback((roomId: string) => {
    cleanup()
    setState({ status: 'connecting', peerId: roomId, error: null })
    const peer = new Peer()
    peerRef.current = peer
    const conn = peer.connect(roomId, { reliable: true })
    connRef.current = conn

    const timeout = setTimeout(() => {
      setState({ status: 'error', peerId: roomId, error: 'Connection timed out. Make sure the desktop is hosting a remote scanner.' })
    }, 15000)

    const onOpen = () => {
      clearTimeout(timeout)
      setState({ status: 'connected', peerId: roomId, error: null })
    }
    const onError = (err: any) => {
      clearTimeout(timeout)
      setState({ status: 'error', peerId: roomId, error: err.message })
    }
    const onClose = () => {
      clearTimeout(timeout)
      connRef.current = null
      setState({ status: 'idle', peerId: null, error: null })
    }

    conn.on('open', onOpen)
    conn.on('error', onError)
    conn.on('close', onClose)
    peer.on('error', onError)
  }, [cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setState({ status: 'idle', peerId: null, error: null })
  }, [cleanup])

  const sendBarcode = useCallback((barcode: string) => {
    if (connRef.current?.open) connRef.current.send(barcode)
  }, [])

  useEffect(() => cleanup, [cleanup])

  return { state, startHosting, stopHosting, connectToHost, disconnect, sendBarcode }
}
