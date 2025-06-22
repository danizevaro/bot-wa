const { Sticker } = require('wa-sticker-formatter')

module.exports = async (sock, msg) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const mime = quoted?.imageMessage ? 'image' : quoted?.videoMessage ? 'video' : null
  if (!mime) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Reply gambar/video untuk diberi watermark.' }, { quoted: msg })

  const stream = await require('@whiskeysockets/baileys').downloadContentFromMessage(quoted[mime + 'Message'], mime)
  const buffer = []
  for await (const chunk of stream) buffer.push(chunk)
  const mediaBuffer = Buffer.concat(buffer)

  const sticker = new Sticker(mediaBuffer, {
    pack: 'My Bot',
    author: 'CreatorBot',
    type: mime === 'image' ? 'full' : 'crop',
    categories: ['🤖'],
    quality: 70
  })

  const stickerBuffer = await sticker.toBuffer()
  await sock.sendMessage(msg.key.remoteJid, { sticker: stickerBuffer }, { quoted: msg })
}