const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const { tmpdir } = require('os')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

function generateFilename(ext = '') {
  return path.join(tmpdir(), `sticker-${Date.now()}.${ext}`)
}

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const mimeQuoted = quoted?.imageMessage ? 'image' : quoted?.videoMessage ? 'video' : null

  const isImage = msg.message?.imageMessage
  const isVideo = msg.message?.videoMessage
  const mimeDirect = isImage ? 'image' : isVideo ? 'video' : null

  let mediaMessage, mimeType

  if (mimeQuoted) {
    mediaMessage = quoted[mimeQuoted + 'Message']
    mimeType = mimeQuoted
  } else if (mimeDirect) {
    const caption = msg.message[mimeDirect + 'Message']?.caption || ''
    if (!caption.trim().toLowerCase().startsWith('/sticker')) return
    mediaMessage = msg.message[mimeDirect + 'Message']
    mimeType = mimeDirect
  } else {
    return sock.sendMessage(from, { text: '❌ Kirim atau reply gambar/video dengan caption /sticker.' }, { quoted: msg })
  }

  const tempInput = generateFilename(mimeType === 'image' ? 'jpg' : 'mp4')
  const tempOutput = generateFilename('webp')

  try {
    const stream = await downloadContentFromMessage(mediaMessage, mimeType)
    const buffer = []
    for await (const chunk of stream) buffer.push(chunk)
    fs.writeFileSync(tempInput, Buffer.concat(buffer))

    await new Promise((resolve, reject) => {
      let proc = ffmpeg(tempInput)
        .on('error', reject)
        .on('end', resolve)

      if (mimeType === 'image') {
        proc = proc.outputOptions([
          '-vcodec', 'libwebp',
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
          '-lossless', '1',
          '-compression_level', '6',
          '-qscale', '70',
          '-preset', 'default'
        ])
      } else {
        proc = proc.outputOptions([
          '-vcodec', 'libwebp',
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
          '-lossless', '0',
          '-compression_level', '6',
          '-qscale', '70',
          '-preset', 'default',
          '-loop', '0',
          '-ss', '0',
          '-t', '6'
        ])
      }

      proc
        .toFormat('webp')
        .save(tempOutput)
    })

    const stickerBuffer = fs.readFileSync(tempOutput)
    await sock.sendMessage(from, {
      sticker: stickerBuffer
    }, { quoted: msg })

  } catch (err) {
    console.error('Gagal membuat stiker:', err)
    await sock.sendMessage(from, { text: '❌ Gagal membuat stiker.' }, { quoted: msg })
  } finally {
    try { fs.unlinkSync(tempInput) } catch { }
    try { fs.unlinkSync(tempOutput) } catch { }
  }
}
