const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const { handler, setupGroupEvents } = require('./handler')

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    auth: state
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      console.log('📲 Scan kode QR berikut untuk login:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ Bot berhasil terhubung ke WhatsApp!')
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401
      console.log('❌ Koneksi terputus.', shouldReconnect ? 'Mencoba reconnect...' : 'Sesi habis. Hapus folder session.')
      if (shouldReconnect) startSock()
    }
  })

  setupGroupEvents(sock)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages[0]?.message) return
    await handler(sock, messages[0])
  })

  sock.ev.on('creds.update', saveCreds)
}

startSock()
