const { pinterest } = require('btch-downloader')

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const query = args.join(' ')

  if (!query) {
    return sock.sendMessage(from, {
      text: '❌ Masukkan kata kunci pencarian Pinterest!\nContoh: pinterest anime girl',
    }, { quoted: msg })
  }

  await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

  try {
    const data = await pinterest(query)

    if (!data?.result?.result || !Array.isArray(data.result.result) || data.result.result.length === 0) {
      throw new Error('❌ Tidak ada hasil ditemukan dari Pinterest.')
    }

    const pins = data.result.result.slice(0, 3)

    for (const pin of pins) {
      const imageUrl = pin.image_url || pin.images?.original || pin.images?.large || pin.images?.medium

      if (!imageUrl) continue

      const caption = [
        '◈───≼ _*Pinterest Result*_ ≽──⊚',
        `📌 *Judul:* ${pin.title || '-'}`,
        `🧾 *Deskripsi:* ${pin.description || '-'}`,
        `🔗 *Link:* ${pin.pin_url || '-'}`,
        `👤 *User:* ${pin.uploader?.full_name || '-'} (@${pin.uploader?.username || '-'})`,
        `🌐 *Profil:* ${pin.uploader?.profile_url || '-'}`,
        '◈┄──━━┉─࿂',
        '© shoutakumo!'
      ].join('\n')

      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption
      }, { quoted: msg })
    }

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

  } catch (err) {
    await sock.sendMessage(from, {
      text: `❌ Gagal mengambil data dari Pinterest.\n\n${err.message}`
    }, { quoted: msg })

    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
  }
}
