const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const os = require('os')

const app = express()
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// keep the last emitted payload so clients that connect after an emit can
// still receive the most recent signal (useful for test harnesses)
let lastPayload = null

function ts() {
  return new Date().toISOString()
}

function log(...args) {
  console.log('[test-server]', ts(), ...args)
}

// simple health endpoint so CI or tests can poll readiness
app.get('/health', (req, res) => res.json({ ok: true }))

app.post('/emit-signal', (req, res) => {
  const payload = req.body || {}
  log('/emit-signal received payload:', JSON.stringify(payload))
  lastPayload = payload
  io.emit('signal', payload)
  log('emitted signal event to connected sockets')
  res.json({ ok: true })
})

io.on('connection', (socket) => {
  log('socket connected:', socket.id)
  // if we have a last payload, send it to the newly connected socket so
  // tests that emit before a client connects still observe the signal
  if (lastPayload) {
    log('sending lastPayload to new socket:', socket.id)
    socket.emit('signal', lastPayload)
  }
  socket.on('disconnect', () => log('socket disconnected:', socket.id))
})

// Export startup diagnostics so orchestrator can read them if needed
const startupInfo = {
  pid: process.pid,
  cwd: process.cwd(),
  node: process.version,
  hostname: os.hostname(),
}

const port = process.env.PORT || 4001
const host = process.env.HOST || '127.0.0.1'
server.listen(port, host, () => {
  log('Test socket server listening on', `${host}:${port}`, JSON.stringify(startupInfo))
})

// Log unhandled errors so CI captures them in test-server.log
process.on('uncaughtException', (err) => {
  console.error('[test-server] uncaughtException', ts(), err && err.stack ? err.stack : err)
  // keep process alive for orchestrator to collect logs, but make failure visible
})
process.on('unhandledRejection', (reason) => {
  console.error('[test-server] unhandledRejection', ts(), reason)
})

module.exports = { server, io, startupInfo }
