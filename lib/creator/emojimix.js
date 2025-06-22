const emojiMixer = require('emoji-mixer').default

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const input = args.join(' ')
  if (!input.includes('+')) {
    return sock.sendMessage(from, {
      text: '❌ Format salah. Contoh: 😅+😂'
    }, { quoted: msg })
  }

  await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

  try {
    const [left, right] = input.split('+').map(e => e.trim())
    const url = emojiMixer(left, right)
    if (!url) throw new Error('Emoji tidak didukung atau kombinasi tidak tersedia.')

    await sock.sendMessage(from, {
      image: { url },
      caption: `🧬 *Emoji Mix*: ${left} + ${right}`
    }, { quoted: msg })

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
  } catch (err) {
    console.error('Emojimix Error:', err.message)
    await sock.sendMessage(from, {
      text: `❌ Gagal menghasilkan Emoji Mix.\n\n${err.message}`
    }, { quoted: msg })
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
  }
}
