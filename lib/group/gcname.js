module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const newName = args.join(' ')
  if (!newName) return sock.sendMessage(from, { text: '❌ Masukkan nama grup baru.' }, { quoted: msg })
  await sock.groupUpdateSubject(from, newName)
  await sock.sendMessage(from, { text: `✅ Nama grup diubah menjadi: ${newName}` }, { quoted: msg })
}
