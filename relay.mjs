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

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString())
    if (role === 'phone' && room.desktop) {
      room.desktop.send(data)
    } else if (role === 'desktop' && room.phone) {
      room.phone.send(data)
    }
  })

  ws.on('close', () => {
    if (room[role] === ws) room[role] = null
    if (!room.desktop && !room.phone) rooms.delete(roomId)
  })
})

console.log(`\n  Relay server running on port ${PORT}`)
console.log(`  Desktop: ws://127.0.0.1:${PORT}`)
console.log(`  Phone target IP: ${localIP}:${PORT}\n`)
