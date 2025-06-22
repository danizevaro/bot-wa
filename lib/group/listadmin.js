module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  const metadata = await sock.groupMetadata(from)
  const admins = metadata.participants.filter(p => p.admin)
  const teks = admins.map(p => `👮 @${p.id.split('@')[0]}`).join('\n')

  await sock.sendMessage(from, {
    text: `Daftar admin grup:\n\n${teks}`,
    mentions: admins.map(p => p.id)
  }, { quoted: msg })
}