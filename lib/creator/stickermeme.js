const { writeFileSync, unlinkSync } = require('fs')
const { tmpdir } = require('os')
const { join } = require('path')
const { spawn } = require('child_process')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (sock, msg, args) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (!quoted?.imageMessage) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Reply gambar untuk dijadikan meme.' }, { quoted: msg })

  const [top, ...bottom] = args.join(' ').split('|')
  const captionTop = top || ''
  const captionBottom = bottom.join(' ') || ''

  const stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
  const buffer = []
  for await (const chunk of stream) buffer.push(chunk)
  const media = Buffer.concat(buffer)

  const inputPath = join(tmpdir(), `meme-${Date.now()}.jpg`)
  const outputPath = join(tmpdir(), `meme-${Date.now()}.webp`)
  writeFileSync(inputPath, media)

  const convert = spawn('convert', [
    inputPath,
    '-gravity', 'north', '-stroke', '#000C', '-strokewidth', '2', '-annotate', '0', captionTop,
    '-stroke', 'none', '-fill', 'white', '-annotate', '0', captionTop,
    '-gravity', 'south', '-stroke', '#000C', '-strokewidth', '2', '-annotate', '0', captionBottom,
    '-stroke', 'none', '-fill', 'white', '-annotate', '0', captionBottom,
    outputPath
  ])

  convert.on('close', async () => {
    const out = require('fs').readFileSync(outputPath)
    await sock.sendMessage(msg.key.remoteJid, { sticker: out }, { quoted: msg })
    unlinkSync(inputPath)
    unlinkSync(outputPath)
  })
}