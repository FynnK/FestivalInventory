import { WebSocketServer } from 'ws'
import os from 'os'

const PORT = parseInt(process.argv[2] || '3001')

function getLocalIP() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return '127.0.0.1'
}

const localIP = getLocalIP()
const rooms = new Map()

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost')
  const roomId = url.searchParams.get('room')
  const role = url.searchParams.get('role')
  if (!roomId || !role) { ws.close(); return }

  if (!rooms.has(roomId)) rooms.set(roomId, {})
  const room = rooms.get(roomId)
  room[role] = ws
  console.log(`[Relay] ${role} joined room ${roomId}`)

  ws.on('message', (data) => {
    const text = data.toString()
    const msg = JSON.parse(text)
    console.log(`[Relay] message from ${role} in room ${roomId}:`, msg.type)
    if (role === 'phone' && room.desktop) {
      console.log('[Relay] forwarding phone → desktop')
      room.desktop.send(text)
    } else if (role === 'desktop' && room.phone) {
      console.log('[Relay] forwarding desktop → phone')
      room.phone.send(text)
    } else {
      console.log('[Relay] no peer to forward to (other role not connected)')
    }
  })

  ws.on('close', () => {
    if (room[role] === ws) room[role] = null
    if (!room.desktop && !room.phone) rooms.delete(roomId)
  })
})

console.log(`\n  === Remote Scanner Relay ===`)
console.log(`  Desktop browser: type this IP → ${localIP}`)
console.log(`  (or open http://localhost:${PORT} in the future)\n`)
