const fetch = require('node-fetch')
const cheerio = require('cheerio')

async function SnapTok(url) {
  if (!/^https:\/\/(vt|www)\.tiktok\.com/.test(url)) {
    return { error: '❌ Link TikTok tidak valid!' }
  }

  try {
    const res = await fetch('https://snap-tok.com/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://snap-tok.com',
        'Referer': 'https://snap-tok.com/tiktok-downloader'
      },
      body: JSON.stringify({ id: url, locale: 'id' })
    })

    const html = await res.text()
    const $ = cheerio.load(html)

    const videoUrl = $('a[href*="tikcdn.io"]').first().attr('href')
    const username = $('h2').first().text().trim() || 'Tidak diketahui'
    const caption = $('p.maintext, div.text-gray-500').first().text().trim() || 'Tanpa deskripsi'

    if (!videoUrl) return { error: '❌ Video tidak ditemukan!' }

    return { username, caption, videoUrl }
  } catch (err) {
    return { error: '❌ Gagal mengambil data TikTok!' }
  }
}

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const url = args[0]

  if (!url) {
    return sock.sendMessage(from, {
      text: '❌ Kirim link TikTok yang valid!',
    }, { quoted: msg })
  }

  await sock.sendMessage(from, {
    react: { text: '⏳', key: msg.key }
  })

  const result = await SnapTok(url)

  if (result.error) {
    await sock.sendMessage(from, {
      text: result.error
    }, { quoted: msg })
    await sock.sendMessage(from, {
      react: { text: '❌', key: msg.key }
    })
    return
  }

  try {
    const res = await fetch(result.videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://snap-tok.com/'
      }
    })

    if (!res.ok || res.status === 204) {
      throw new Error(`Link video tidak dapat diakses (status ${res.status})`)
    }

    const buffer = await res.buffer()

    const captionFormatted = [
      '◈───≼ _*TikTok Video*_ ≽──⊚',
      `👤 *User:* ${result.username}`,
      `📝 *Deskripsi:* ${result.caption}`,
      '◈┄──━━┉─࿂',
      '© shoutakumo!'
    ].join('\n')

    await sock.sendMessage(
      from,
      {
        video: buffer,
        caption: captionFormatted,
        ptv: false
      },
      { quoted: msg }
    )

    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    })
  } catch (err) {
    await sock.sendMessage(from, {
      text: `❌ TikTok Error: ${err.message}`
    }, { quoted: msg })
    await sock.sendMessage(from, {
      react: { text: '❌', key: msg.key }
    })
  }
}