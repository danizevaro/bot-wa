module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const users = args.map(u => u.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  await sock.groupParticipantsUpdate(from, users, 'demote')
}
