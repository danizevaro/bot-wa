const axios = require('axios')
const cheerio = require('cheerio')

async function getSecurityToken() {
  const { data: html } = await axios.get('https://evoig.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })

  const $ = cheerio.load(html)
  const token =
    $('script:contains("ajax_var")')
      .html()
      ?.match(/"security"\s*:\s*"([a-z0-9]{10,})"/i)?.[1] ||
    html.match(/"security"\s*:\s*"([a-z0-9]{10,})"/i)?.[1] ||
    null

  if (!token) throw new Error('Gomen ne~ Aku nggak nemu token security-nya 😔')
  return token
}

async function EvoIG(url) {
  if (!url.includes('instagram.com')) {
    return { error: '❌ Link Instagram tidak valid!' }
  }

  try {
    const token = await getSecurityToken()
    const form = new URLSearchParams()
    form.append('action', 'ig_download')
    form.append('security', token)
    form.append('ig_url', url)

    const { data } = await axios.post('https://evoig.com/wp-admin/admin-ajax.php', form, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://evoig.com',
        'referer': 'https://evoig.com/',
        'user-agent': 'Mozilla/5.0',
        'x-requested-with': 'XMLHttpRequest'
      }
    })

    const result = data?.data?.data?.[0]
    if (!result || !result.link) return { error: '❌ Gagal mengambil video!' }

    return {
      type: result.type,
      thumb: result.thumb,
      url: result.link
    }
  } catch (e) {
    return { error: '❌ EvoIG error: ' + e.message }
  }
}

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const url = args[0]

  if (!url) {
    return sock.sendMessage(from, {
      text: '❌ Kirim link Instagram yang valid!',
    }, { quoted: msg })
  }

  await sock.sendMessage(from, {
    react: { text: '⏳', key: msg.key }
  })

  const result = await EvoIG(url)

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
    const res = await axios.get(result.url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
        'Referer': 'https://evoig.com/'
      }
    })

    const buffer = Buffer.from(res.data)

    const caption = [
      '◈───≼ _*Instagram Video*_ ≽──⊚',
      `🎞️ *Type:* ${result.type}`,
      `🖼️ *Thumbnail:* ${result.thumb}`,
      '◈┄──━━┉─࿂',
      '© shoutakumo!'
    ].join('\n')

    await sock.sendMessage(from, {
      video: buffer,
      caption,
      ptv: false
    }, { quoted: msg })

    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    })

  } catch (e) {
    await sock.sendMessage(from, {
      text: '❌ Gagal kirim video: ' + e.message
    }, { quoted: msg })
    await sock.sendMessage(from, {
      react: { text: '❌', key: msg.key }
    })
  }
}
