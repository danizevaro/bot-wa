module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const groupMetadata = await sock.groupMetadata(from)
  const participants = groupMetadata.participants.map(p => p.id)

  await sock.sendMessage(from, {
    text: args.join(' ') || 'Hidetag by bot',
    mentions: participants
  }, { quoted: msg })
}
