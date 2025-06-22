const { igdl } = require('btch-downloader')
const axios = require('axios')

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const url = args[0]

  if (!url || !/^https?:\/\/(www\.)?instagram\.com/.test(url)) {
    return sock.sendMessage(from, {
      text: '❌ Kirim link Instagram yang valid!',
    }, { quoted: msg })
  }

  await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

  try {
    const result = await igdl(url)

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('❌ Tidak ada media ditemukan.')
    }

    const media = result[0]
    const contentType = await detectType(media.url)

    const caption = [
      '◈───≼ _*Instagram Media*_ ≽──⊚',
      `🔗 *URL:* ${url}`,
      `📦 *Tipe:* ${contentType === 'video/mp4' ? 'Video' : 'Gambar'}`,
      '◈┄──━━┉─࿂',
      '© shoutakumo!'
    ].join('\n')

    if (contentType === 'video/mp4') {
      await sock.sendMessage(from, {
        video: { url: media.url },
        caption,
        ptv: false
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, {
        image: { url: media.url },
        caption
      }, { quoted: msg })
    }

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
  } catch (err) {
    await sock.sendMessage(from, {
      text: `❌ Gagal mengunduh media Instagram.\n\n${err.message}`
    }, { quoted: msg })

    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
  }
}

async function detectType(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { Range: 'bytes=0-262' }
    })

    const buffer = Buffer.from(res.data)

    if (buffer.includes(Buffer.from('ftyp'))) return 'video/mp4'
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
    if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png'

    return 'unknown'
  } catch {
    return 'unknown'
  }
}