module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const newDesk = args.join(' ')
  if (!newDesk) return sock.sendMessage(from, { text: '❌ Masukkan deskripsi grup baru.' }, { quoted: msg })
  await sock.groupUpdateDescription(from, newDesk)
  await sock.sendMessage(from, { text: '✅ Deskripsi grup telah diubah.' }, { quoted: msg })
}
