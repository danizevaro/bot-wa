module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  const sender = msg.key.participant || msg.key.remoteJid
  const m = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''

  const metadata = await sock.groupMetadata(from)
  const isAdmin = metadata.participants.find(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'))

  // Deteksi link grup / spam link (Antilink manual tambahan)
  if (/(https:\/\/chat\.whatsapp\.com\/[\w\d]+)/i.test(m)) {
    if (!isAdmin) {
      await sock.sendMessage(from, { text: '🚫 Link grup terdeteksi, pengguna akan dikick dan pesan dihapus!' }, { quoted: msg })
      await sock.sendMessage(from, { delete: msg.key })
      await sock.groupParticipantsUpdate(from, [sender], 'remove')
    }
  }

  // Deteksi kata kasar / toxic
  const badwords = ['anjing', 'goblok', 'kontol', 'tolol', 'puki', 'pukimak', 'jancok', 'memek', 'bajingan']
  if (badwords.some(word => m.toLowerCase().includes(word))) {
    await sock.sendMessage(from, { text: '⚠️ Tolong jaga bahasa kamu ya. Pesan akan dihapus.' }, { quoted: msg })
    await sock.sendMessage(from, { delete: msg.key })
  }

  // Deteksi spam emoji (lebih dari 10 emoji berurutan)
  const emojiMatch = m.match(/(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\u0000-\u007F])+/g)
  if (emojiMatch && emojiMatch.join('').length > 15) {
    await sock.sendMessage(from, { text: '❗ Terlalu banyak emoji, pesan dihapus.' }, { quoted: msg })
    await sock.sendMessage(from, { delete: msg.key })
  }
}