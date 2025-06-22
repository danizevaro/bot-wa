module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  await sock.groupSettingUpdate(from, 'announcement')
  await sock.sendMessage(from, { text: '✅ Grup ditutup hanya admin yang bisa mengirim pesan.' }, { quoted: msg })
}
