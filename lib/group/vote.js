module.exports = async (sock, msg, args) => {
  const from = msg.key.remoteJid
  const question = args.join(' ')
  if (!question) return sock.sendMessage(from, { text: '❌ Masukkan pertanyaan voting.' }, { quoted: msg })
  await sock.sendMessage(from, {
    poll: {
      name: question,
      values: ['Ya', 'Tidak']
    }
  }, { quoted: msg })
}
