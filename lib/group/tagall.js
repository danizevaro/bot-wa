module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  const metadata = await sock.groupMetadata(from)
  const teks = metadata.participants.map(p => `• @${p.id.split('@')[0]}`).join('\n')

  await sock.sendMessage(from, {
    text: `Tag semua member:\n\n${teks}`,
    mentions: metadata.participants.map(p => p.id)
  }, { quoted: msg })
}
