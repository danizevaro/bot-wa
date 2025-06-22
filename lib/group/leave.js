module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  await sock.sendMessage(from, { text: '👋 Bye!' }, { quoted: msg })
  await sock.groupLeave(from)
}
