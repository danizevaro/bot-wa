module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const value = parseInt(args[0])
  if (isNaN(value)) return sock.sendMessage(from, { text: '❌ Masukkan durasi ephemeral dalam detik (contoh: 86400)' }, { quoted: msg })
  await sock.sendMessage(from, { ephemeralExpiration: value })
  await sock.sendMessage(from, { text: `✅ Mode pesan sementara diatur ke ${value} detik.` }, { quoted: msg })
}
