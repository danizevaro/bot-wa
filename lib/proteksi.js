const cooldown = new Map()
const spamLimit = new Map()

const COOLDOWN_TIME = 5 * 1000 // 5 detik
const SPAM_TIMEFRAME = 7000 // 7 detik
const SPAM_THRESHOLD = 6

module.exports = (sock, msg, command) => {
  const sender = msg.key.participant || msg.key.remoteJid
  const now = Date.now()

  // Deteksi spam
  if (!spamLimit.has(sender)) spamLimit.set(sender, [])
  spamLimit.get(sender).push(now)
  spamLimit.set(sender, spamLimit.get(sender).filter(ts => now - ts < SPAM_TIMEFRAME))

  if (spamLimit.get(sender).length > SPAM_THRESHOLD) {
    return false
  }

  // Deteksi cooldown command
  if (cooldown.has(sender)) {
    const last = cooldown.get(sender)
    if (now - last < COOLDOWN_TIME) {
      return false
    }
  }

  cooldown.set(sender, now)
  return true
}