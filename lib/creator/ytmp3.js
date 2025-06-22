const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const yts = require('@vreden/youtube_scraper')

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const query = args.join(' ').trim()
  const tmpDir = '/tmp/audio'

  if (!query) {
    return sock.sendMessage(from, {
      text: '❌ Masukkan judul atau link YouTube.'
    }, { quoted: msg })
  }

  await sock.sendMessage(from, {
    react: { text: '⏳', key: msg.key }
  })

  try {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    let url = ''
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      url = query
    } else {
      const search = await yts.search(query)
      if (!search.videos.length) throw new Error('Video tidak ditemukan.')
      url = `https://www.youtube.com/watch?v=${search.videos[0].id}`
    }

    const outPath = path.join(tmpDir, '%(title).80s.%(ext)s')
    const command = `./bin/yt-dlp -x --audio-format mp3 -o "${outPath}" "${url}"`

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', error.message)
        await sock.sendMessage(from, {
          text: '❌ Download gagal: ' + error.message
        }, { quoted: msg })
        return await sock.sendMessage(from, {
          react: { text: '❌', key: msg.key }
        })
      }

      const files = glob.sync(path.join(tmpDir, '*.mp3'))
      if (!files.length) {
        await sock.sendMessage(from, {
          text: '❌ File mp3 tidak ditemukan setelah konversi.'
        }, { quoted: msg })
        return await sock.sendMessage(from, {
          react: { text: '❌', key: msg.key }
        })
      }

      const mp3File = files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]

      await sock.sendMessage(from, {
        audio: fs.readFileSync(mp3File),
        mimetype: 'audio/mpeg',
        ptt: true
      }, { quoted: msg })

      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      })

      fs.unlinkSync(mp3File)
    })

  } catch (err) {
    console.error('❌ YTMP3 Error:', err.message)
    await sock.sendMessage(from, {
      text: '❌ YTMP3 Error: ' + err.message
    }, { quoted: msg })

    await sock.sendMessage(from, {
      react: { text: '❌', key: msg.key }
    })
  }
}
