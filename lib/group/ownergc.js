module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  const metadata = await sock.groupMetadata(from)
  const owner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id
  await sock.sendMessage(from, { text: `👑 Owner grup: @${owner.split('@')[0]}`, mentions: [owner] }, { quoted: msg })
}
