module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  await sock.groupSettingUpdate(from, 'not_announcement')
  await sock.sendMessage(from, { text: '✅ Grup dibuka semua anggota bisa mengirim pesan.' }, { quoted: msg })
}
