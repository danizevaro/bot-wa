const fs = require('fs')
const path = require('path')
const { createCanvas, registerFont } = require('canvas')
const { tmpdir } = require('os')
const ffmpeg = require('fluent-ffmpeg')

function generateFilename(ext = '') {
  return path.join(tmpdir(), `ttp-${Date.now()}.${ext}`)
}

registerFont(path.join(__dirname, '../fonts/ComicNeue-Bold.ttf'), {
  family: 'Comic Neue'
})

module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const text = args.join(' ')
  if (!text) {
    return sock.sendMessage(from, { text: '❌ Masukkan teks!\nContoh: /ttp Halo Dunia' }, { quoted: msg })
  }

  const canvasSize = 512
  const canvas = createCanvas(canvasSize, canvasSize)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 70px "Comic Neue"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const words = text.split(' ')
  const lines = []
  let line = ''

  for (let word of words) {
    const testLine = line + word + ' '
    const width = ctx.measureText(testLine).width
    if (width > canvasSize - 40) {
      lines.push(line.trim())
      line = word + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line.trim())

  const lineHeight = 50
  const yStart = (canvasSize - lines.length * lineHeight) / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvasSize / 2, yStart + i * lineHeight)
  }

  const tempInput = generateFilename('png')
  const tempOutput = generateFilename('webp')

  fs.writeFileSync(tempInput, canvas.toBuffer())

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .on('error', reject)
        .on('end', resolve)
        .outputOptions([
          '-vcodec', 'libwebp',
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease',
          '-lossless', '1',
          '-compression_level', '6',
          '-qscale', '70',
          '-preset', 'picture',
          '-an',
          '-vsync', '0'
        ])
        .toFormat('webp')
        .save(tempOutput)
    })

    if (!fs.existsSync(tempOutput) || fs.statSync(tempOutput).size < 1000) {
      throw new Error('File output corrupt atau terlalu kecil.')
    }

    const stickerBuffer = fs.readFileSync(tempOutput)

    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg })

  } catch (err) {
    console.error('❌ TTP Error:', err)
    await sock.sendMessage(from, { text: '❌ Gagal membuat stiker teks.' }, { quoted: msg })
  } finally {
    try { fs.unlinkSync(tempInput) } catch {}
    try { fs.unlinkSync(tempOutput) } catch {}
  }
}
