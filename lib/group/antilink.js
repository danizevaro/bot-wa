module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  if (text.includes('chat.whatsapp.com')) {
    const sender = msg.key.participant || msg.key.remoteJid
    await sock.sendMessage(from, { text: '⚠️ Link grup terdeteksi, pengguna akan dikick!' })
    await sock.groupParticipantsUpdate(from, [sender], 'remove')
  }
}
