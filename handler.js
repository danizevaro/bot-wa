const fs = require('fs')
const group = require('./lib/group')
const creator = require('./lib/creator')
const proteksi = require('./lib/proteksi')
const satpam = require('./lib/satpam')
const sticker = require('./lib/creator/sticker')
let db = require('./lib/db')
const owner = require('./lib/owner.json')
const config = require('./config')
const DB_PATH = './lib/db.json'

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function setupGroupEvents(sock) {
  sock.ev.on('groups.upsert', async (groups) => {
    for (const group of groups) {
      const id = group.id
      const metadata = await sock.groupMetadata(id)
      const groupName = metadata.subject

      if (!db.groups) db.groups = {}
      if (!db.groups[id]) {
        db.groups[id] = {
          approved: false,
          name: groupName,
          addedAt: Date.now(),
          users: {}
        }
        saveDB()

        const introCaption = `
┏━✿ *YUUCHAN IS HERE!* ✿━┓

(｡♥‿♥｡) Konbanwa minna~!!
Aku *Yuu-chan* bot kawaii dari dunia 🌙!

💌 Terima kasih sudah mengundangku ke grup *${groupName}*.

Namun demi keamanan dan kenyamanan 🌸,
bot ini belum bisa digunakan sebelum disetujui oleh *Owner Bot*.

Silakan hubungi Owner untuk ketik:
*.approve*

🧸 Aku janji akan jadi bot paling imut dan membantu~ nyaaa~ (๑>◡<๑)

┗━━━━━━✿━━━━━━┛
`

        const imagePath = './media/images/yuuchan.jpg'
        if (fs.existsSync(imagePath)) {
          await sock.sendMessage(id, {
            image: fs.readFileSync(imagePath),
            caption: introCaption
          })
        } else {
          await sock.sendMessage(id, { text: introCaption })
        }
      }
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    try {
      const metadata = await sock.groupMetadata(update.id)
      const groupName = metadata.subject

      for (const participant of update.participants) {
        const tag = `@${participant.split('@')[0]}`
        const borderLeft = '│'
        const borderBottom = '╰─────────────✿'
        const header = `ᯓ★ ࣪ ִֶָ☾. ᯓᡣ𐭩  *Yuuchan Notifier* ᯓ★ ࣪ ִֶָ☾. ᯓᡣ𐭩`

        if (update.action === 'add') {
          const welcomeText = `
${header}
${borderLeft} 𝙷𝚎𝚕𝚕𝚘 ${tag}~ 💖
${borderLeft} 𝚂𝚎𝚕𝚊𝚖𝚊𝚝 𝚍𝚊𝚝𝚊𝚗𝚐 𝚍𝚒 *${groupName}* ✨
${borderLeft} 𝙱𝚊𝚌𝚊 𝚍𝚎𝚜𝚔𝚛𝚒𝚙𝚜𝚒 𝚢𝚊, 𝚓𝚊𝚗𝚐𝚊𝚗 𝚖𝚊𝚕𝚞~ 
${borderLeft} (⁄⁄•⁄ω⁄•⁄⁄)
${borderLeft}
${borderLeft} Lihat *menu* dengan ketik .menu
${borderBottom}`

          await sock.sendMessage(update.id, {
            text: welcomeText,
            mentions: [participant]
          })
        }

        if (update.action === 'remove') {
          const goodbyeText = `
${header}
${borderLeft} 𝙳𝚊𝚑 ${tag}~ 👋
${borderLeft} 𝙼𝚊𝚊𝚏 𝚔𝚊𝚖𝚞 𝚝𝚒𝚍𝚊𝚔 𝚕𝚊𝚐𝚒 𝚋𝚎𝚛𝚐𝚊𝚋𝚞𝚗𝚐 😿
${borderLeft} 𝚂𝚎𝚖𝚘𝚐𝚊 𝚑𝚊𝚛𝚒𝚖𝚞 𝚖𝚎𝚗𝚢𝚎𝚗𝚊𝚗𝚐𝚔𝚊𝚗~ 🐾
${borderBottom}`

          await sock.sendMessage(update.id, {
            text: goodbyeText,
            mentions: [participant]
          })
        }
      }
    } catch (err) {
      console.error('❌ Error saat handle welcome/leave:', err)
    }
  })
}

const handler = async (sock, msg) => {
  let textCommand =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''

  const lowered = textCommand.trim().toLowerCase()

  const from = msg.key.remoteJid
  const sender = msg.key.participant || msg.key.remoteJid

  const keywordTriggers = [
    {
      keywords: ['oi', 'woi', 'p', 'pp', 'pe', 'pa', 'pnya', 'pi', 'piye', 'pih'],
      text: 'Iya sayang, ada apa? ❤️',
      audio: './media/apa-sayang.ogg'
    },
    {
      keywords: ['iya kan sayang', 'ya kan sayangku', 'ya kan sayang', 'bener kan sayang'],
      text: 'Iya sayang, aku di sini kok 🥰',
      audio: './media/iyaaa.ogg'
    },
    {
      keywords: ['sayang', 'sayangku', 'cayang', 'ayang', 'beb', 'bebz'],
      text: 'Iya sayang, aku di sini kok 🥰',
      audio: './media/iya-sayang.ogg'
    },
    {
      keywords: ['alo', 'aloo', 'halo', 'hallo', 'hay', 'woi', 'hoi', 'hi'],
      text: 'Halooo juga! ✨',
      audio: './media/apa-sayang.ogg'
    },
    {
      keywords: ['assalamualaikum', 'asalamualaikum', 'assalammualaikum', 'assalam'],
      text: 'Waalaikumussalam 😇',
      audio: './media/waalaikum.ogg'
    },
    {
      keywords: ['owner', 'halo owner', 'owner dimana', 'owner mana'],
      text: 'Owner-nya lagi sibuk, sayang~ 👑',
      audio: './media/owner-sayang.ogg'
    },
    {
      keywords: ['bantu', 'bantuin', 'bantu aku', 'bantu dong', 'bantu gw', 'tolong dong', 'tolong gw', 'susah', 'bingung', 'ga ngerti'],
      text: 'Tenang, aku bantu sebisaku 🤝',
      audio: './media/ingin-bantu.ogg'
    },
    {
      keywords: ['onichan', 'oniichan', 'oni chan', 'onii chan', 'oniii chan', 'onichaan', 'Yuu', 'Yuu Chan'],
      text: 'Onii-chaaaan~ 🥺💕',
      audio: './media/converted_oniichan.ogg'
    }
  ]

  const prefix = config.prefix
  const command = textCommand.startsWith(prefix) ? textCommand.split(' ')[0].slice(prefix.length).toLowerCase() : ''
  const args = textCommand.trim().split(/ +/).slice(1)

  if (lowered.startsWith(prefix)) {
    if (!from.endsWith('@g.us')) return

    if (!db.groups) db.groups = {}
    if (!db.groups[from]) {
      const metadata = await sock.groupMetadata(from)
      db.groups[from] = { approved: false, name: metadata.subject, addedBy: sender, users: {} }
      saveDB()
      await sock.sendMessage(from, {
        text: `🚧 Bot ini belum diaktifkan di grup ini.
Hanya *owner bot* yang dapat mengaktifkan dengan mengetik ${prefix}approve.`
      })
      return
    }
    if (!db.groups[from].approved && command !== 'approve') return

    const now = Date.now()
    if (!db.groups[from].users[sender]) db.groups[from].users[sender] = { xp: 0, level: 1, role: 'Pemula', reward: 0, lastClaim: 0, money: 500, inventory: [] }
    const user = db.groups[from].users[sender]
    if (user.money === undefined) user.money = 500
    if (!Array.isArray(user.inventory)) user.inventory = []

    user.xp += Math.floor(Math.random() * 10 + 5)
    const needed = user.level * 100
    if (user.xp >= needed) {
      user.xp -= needed
      user.level++
      const bonus = user.level * 10
      user.money += bonus
      user.reward += bonus
      user.role = user.level >= 30 ? 'Legenda' : user.level >= 20 ? 'Pro' : user.level >= 10 ? 'Aktif' : 'Pemula'
      await sock.sendMessage(from, {
        text: `╭────〔 *LEVEL UP!* 〕────
Congratulations, You level up 🎉

* *- Level:* ~${user.level - 1}~ ••> *${user.level}*
* *- Role:* ${user.role}
* *- Reward:* ${bonus.toLocaleString()} Money

_Semakin sering kamu berinteraksi dengan Tsukiyuki Miyako, semakin tinggi level kamu 💖_
╰─────────────────────`,
        mentions: [sender]
      }, { quoted: msg })
    }
    saveDB()

    const metadata = await sock.groupMetadata(from)
    const isAdmin = metadata.participants.find(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'))

    const adminOnly = [
      'hidetag', 'close', 'open', 'gcname', 'gcdesk', 'add', 'kick',
      'promote', 'demote', 'ephemeral', 'antilink', 'ban', 'unban', 'whitelist', 'listban', 'listwhitelist'
    ]

    if (adminOnly.includes(command) && !isAdmin) {
      return sock.sendMessage(from, { text: '❌ Fitur ini hanya bisa digunakan oleh admin grup.' }, { quoted: msg })
    }

    if (!proteksi(sock, msg, command)) return

    if (command === 'approve' && sender === owner.number) {
      db.groups[from].approved = true
      saveDB()

      const approvedMessage = `
╭─〔 *YUUCHAN AKTIF!* 〕─✿
(≧◡≦) わーい！

Grup ini sudah *disetujui oleh Owner*~ 🎉

Mulai sekarang aku siap membantu, menghibur, dan menemani kalian semua! 💖

📜 Untuk melihat menu lengkap, ketik:
*${prefix}menu*

oh iya, coba ketik:
*halo owner*

Jangan lupa ajak aku main~ nyan~ 🐾

╰─✿ Arigatou, Owner-sama! ✿─╯
`

      return sock.sendMessage(from, { text: approvedMessage })
    }

    if (command === 'balance') {
      const balanceText = `╭────〔 *YOUR BALANCE* 〕────
* *- Coin:* ${user.money.toLocaleString()} coins
╰───────────────────────`
      return sock.sendMessage(from, { text: balanceText }, { quoted: msg })
    }

    if (command === 'store') {
      const storeItems = [
        { name: 'Potion', price: 100 },
        { name: 'Elixir', price: 250 },
        { name: 'Diamond', price: 500 }
      ]
      const list = storeItems.map((item, i) => `┝⎆ [ _${item.name}_ - ${item.price.toLocaleString()} coins ]`).join('\n')

      const storeText = `◈───≼ _*Toko Item*_ ≽──⊚
${list}
◈┄──━━┉─࿂
Gunakan _${prefix}buy <nama item>_`

      return sock.sendMessage(from, { text: storeText }, { quoted: msg })
    }

    if (command === 'buy') {
      const itemName = args.join(' ').trim()
      const storeItems = {
        potion: 100,
        elixir: 250,
        diamond: 500
      }
      const itemKey = itemName.toLowerCase()
      const itemPrice = storeItems[itemKey]
      if (!itemPrice) return sock.sendMessage(from, { text: `❌ Item tidak ditemukan.` }, { quoted: msg })
      if (user.money < itemPrice) return sock.sendMessage(from, { text: `❌ Uang kamu tidak cukup untuk membeli ${itemName}.` }, { quoted: msg })
      user.money -= itemPrice
      user.inventory.push(itemKey)
      saveDB()
      return sock.sendMessage(from, {
        text: `╭────〔 *PEMBELIAN BERHASIL* 〕────
* *- Item:* ${itemName}
* *- Harga:* ${itemPrice.toLocaleString()} coins
* *- Sisa Coin:* ${user.money.toLocaleString()}
╰─────────────────────────────`
      }, { quoted: msg })
    }

    if (command === 'daily') {
      const diff = now - (user.lastClaim || 0)
      if (diff < 86400000) {
        const hours = Math.floor((86400000 - diff) / 3600000)
        return sock.sendMessage(from, {
          text: `⏳ Kamu sudah klaim hari ini.\nKlaim lagi dalam ${hours} jam.`,
        }, { quoted: msg })
      }
      const reward = 100
      user.money += reward
      user.lastClaim = now
      saveDB()
      const dailyText = `╭────〔 *DAILY REWARD* 〕────
✅ Kamu berhasil klaim harian!
* *- Hadiah:* ${reward.toLocaleString()} coins
╰───────────────────────`
      return sock.sendMessage(from, {
        text: dailyText
      }, { quoted: msg })
    }

    if (command === 'profile') {
      let pfp
      try {
        pfp = await sock.profilePictureUrl(sender, 'image')
      } catch {
        pfp = 'https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2220431045.jpg'
      }

      const xpNeed = user.level * 100
      const xpProgress = `${user.xp}/${xpNeed}`

      const profileText = `╭────〔 *YOUR PROFILE* 〕────
* *- ID:* @${sender.split('@')[0]}
* *- Level:* ${user.level}
* *- XP:* ${xpProgress}
* *- Role:* ${user.role}
* *- Coin:* ${user.money.toLocaleString()}
* *- Reward:* ${user.reward.toLocaleString()}
╰───────────────────────`

      await sock.sendMessage(from, {
        image: { url: pfp },
        caption: profileText,
        mentions: [sender]
      }, { quoted: msg })
    }

    if (command === 'leaderboard') {
      const users = Object.entries(db.groups[from].users || {})
      const sorted = users.sort(([, a], [, b]) => b.level - a.level || b.xp - a.xp)
      const top10 = sorted.slice(0, 10).map(([id, u], i) =>
        `┝⎆ [ *${i + 1}.* @${id.split('@')[0]} - Lv. ${u.level} (${u.xp} XP) ]`
      ).join('\n')

      const leaderboardText = `◈───≼ _*TOP 10 LEADERBOARD*_ ≽──⊚
${top10}
◈┄──━━┉─࿂`

      return sock.sendMessage(from, {
        text: leaderboardText,
        mentions: sorted.slice(0, 10).map(([id]) => id)
      }, { quoted: msg })
    }

    if (command === 'inventory') {
      const inv = user.inventory.length > 0
        ? user.inventory.map((item, i) => `┝⎆ [ _${item}_ ]`).join('\n')
        : '┝⎆ [ _Kosong_ ]'

      const inventoryText = `◈───≼ _*INVENTORY*_ ≽──⊚
${inv}
◈┄──━━┉─࿂`

      return sock.sendMessage(from, { text: inventoryText }, { quoted: msg })
    }

    if (command === 'sticker') return sticker(sock, msg, args)

    if (command === 'menu') {
      const menu = `‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‎
◈───≼ _*YUUBOT MENU*_ ≽──⊚
┝⎆ [ _${prefix}profile_ ]
┝⎆ [ _${prefix}daily_ ]
┝⎆ [ _${prefix}balance_ ]
┝⎆ [ _${prefix}store_ ]
┝⎆ [ _${prefix}buy <item>_ ]
┝⎆ [ _${prefix}inventory_ ]
┝⎆ [ _${prefix}leaderboard_ ]

◈───≼ _*CREATOR*_ ≽──⊚
┝⎆ [ _${prefix}sticker_ ]
┝⎆ [ _${prefix}stickerwm <author>|<pack>_ ]
┝⎆ [ _${prefix}meme <atas>|<bawah>_ ]

◈───≼ _*ADMIN*_ ≽──⊚
┝⎆ [ _${prefix}menuadmin_ ]
◈┄──━━┉─࿂

© shoutakumo!`

      return sock.sendMessage(from, { text: menu }, { quoted: msg })
    }

    if (command === 'menuadmin') {
      if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Menu ini hanya untuk admin grup.' }, { quoted: msg })
      }

      const adminMenu = `◈───≼ _*ADMIN MENU*_ ≽──⊚

🔐 *Group Control*
┝⎆ [ _${prefix}hidetag_ ]
┝⎆ [ _${prefix}alltag_ ]
┝⎆ [ _${prefix}close / open_ ]
┝⎆ [ _${prefix}gcname <nama>_ ]
┝⎆ [ _${prefix}gcdesk <deskripsi>_ ]
┝⎆ [ _${prefix}add <nomor>_ ]
┝⎆ [ _${prefix}kick <tag>_ ]
┝⎆ [ _${prefix}promote <tag>_ ]
┝⎆ [ _${prefix}demote <tag>_ ]
┝⎆ [ _${prefix}ephemeral <detik>_ ]
┝⎆ [ _${prefix}antilink on/off_ ]

👑 *Owner Only*
┝⎆ [ _${prefix}approve_ ]
┝⎆ [ _${prefix}ban <tag>_ ]
┝⎆ [ _${prefix}unban <tag>_ ]
┝⎆ [ _${prefix}whitelist <tag>_ ]
┝⎆ [ _${prefix}listban_ ]
┝⎆ [ _${prefix}listwhitelist_ ]
┝⎆ [ _${prefix}reset_ ]

◈┄──━━┉─࿂`

      return sock.sendMessage(from, { text: adminMenu }, { quoted: msg })
    }

    if (command === 'ban') {
      const target = args[0]?.replace(/[^\d]/g, '') + '@s.whatsapp.net'
      if (!target) return sock.sendMessage(from, { text: 'Masukkan nomor yang ingin diban.' }, { quoted: msg })
      if (!db.banned.includes(target)) db.banned.push(target)
      saveDB()
      return sock.sendMessage(from, {
        text: `🔒 User *@${target.split('@')[0]}* telah dibanned.`,
        mentions: [target]
      }, { quoted: msg })
    }

    if (command === 'unban') {
      const target = args[0]?.replace(/[^\d]/g, '') + '@s.whatsapp.net'
      if (!target) return sock.sendMessage(from, { text: 'Masukkan nomor yang ingin diunban.' }, { quoted: msg })
      db.banned = db.banned.filter(id => id !== target)
      saveDB()
      return sock.sendMessage(from, {
        text: `🔓 User *@${target.split('@')[0]}* telah diunban.`,
        mentions: [target]
      }, { quoted: msg })
    }

    if (command === 'whitelist') {
      const target = args[0]?.replace(/[^\d]/g, '') + '@s.whatsapp.net'
      if (!target) return sock.sendMessage(from, { text: 'Masukkan nomor yang ingin di-whitelist.' }, { quoted: msg })
      if (!db.whitelist.includes(target)) db.whitelist.push(target)
      saveDB()
      return sock.sendMessage(from, {
        text: `✅ User *@${target.split('@')[0]}* telah ditambahkan ke whitelist.`,
        mentions: [target]
      }, { quoted: msg })
    }

    if (command === 'listban') {
      if (db.banned.length === 0) return sock.sendMessage(from, { text: '🚫 Tidak ada user yang dibanned.' }, { quoted: msg })
      const list = db.banned.map((id, i) => `┝⎆ [ _${i + 1}. ${id.replace(/@s.whatsapp.net/, '')}_ ]`).join('\n')
      const text = `◈───≼ _*DAFTAR BANNED*_ ≽──⊚
${list}
◈┄──━━┉─࿂`
      return sock.sendMessage(from, { text }, { quoted: msg })
    }

    if (command === 'listwhitelist') {
      if (db.whitelist.length === 0) return sock.sendMessage(from, { text: '📭 Tidak ada user di whitelist.' }, { quoted: msg })
      const list = db.whitelist.map((id, i) => `┝⎆ [ _${i + 1}. ${id.replace(/@s.whatsapp.net/, '')}_ ]`).join('\n')
      const text = `◈───≼ _*DAFTAR WHITELIST*_ ≽──⊚
${list}
◈┄──━━┉─࿂`
      return sock.sendMessage(from, { text }, { quoted: msg })
    }

    await satpam(sock, msg)

    if (group[command]) return group[command](sock, msg, args)
    if (creator[command]) return creator[command](sock, msg, args)

    return
  }

  const isFromMe = msg.key.fromMe || sender === sock.user.id
  if (isFromMe) return

  if (textCommand.startsWith(prefix)) return

  const messageWords = textCommand.toLowerCase().trim().split(/\s+/)

  for (let trigger of keywordTriggers) {
    for (let keyword of trigger.keywords) {
      if (messageWords.includes(keyword.toLowerCase())) {
        const hasAudio = trigger.audio && fs.existsSync(trigger.audio)
        const preferAudio = hasAudio && Math.random() < 0.8

        if (preferAudio) {
          await sock.sendMessage(from, {
            audio: fs.readFileSync(trigger.audio),
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
          }, { quoted: msg })
        } else if (trigger.text) {
          await sock.sendMessage(from, {
            text: trigger.text,
            mentions: [sender]
          }, { quoted: msg })
        }

        return
      }
    }
  }

  sock.ev.on('group-participants.update', async (update) => {
    try {
      const metadata = await sock.groupMetadata(update.id)
      const groupName = metadata.subject

      for (let participant of update.participants) {
        const tag = `@${participant.split('@')[0]}`
        const borderLeft = '│'
        const footer = '╰─────────────✿'
        const header = `ᯓ★ ࣪ ִֶָ☾. ᯓᡣ𐭩  *Yuuchan Notifier* ᯓ★ ࣪ ִֶָ☾. ᯓᡣ𐭩`

        if (update.action === 'add') {
          const welcomeMessage = `
${header}
${borderLeft} 𝙷𝚎𝚕𝚕𝚘 ${tag}~ 🐾
${borderLeft} 𝚂𝚎𝚕𝚊𝚖𝚊𝚝 𝚍𝚊𝚝𝚊𝚗𝚐 𝚍𝚒 *${groupName}* ✨
${borderLeft} 𝙰𝚓𝚊𝚔 𝚖𝚊𝚒𝚗, 𝚋𝚊𝚌𝚊 𝚍𝚎𝚜𝚔𝚛𝚒𝚙𝚜𝚒 𝚓𝚞𝚐𝚊 𝚢𝚊~ 🐶
${footer}`

          await sock.sendMessage(update.id, {
            text: welcomeMessage,
            mentions: [participant]
          })
        }

        if (update.action === 'remove') {
          const goodbyeMessage = `
${header}
${borderLeft} 𝙳𝚊𝚑 ${tag}~ 👋
${borderLeft} 𝚂𝚊𝚖𝚙𝚊𝚒 𝚓𝚞𝚖𝚙𝚊 𝚍𝚒 𝚕𝚊𝚒𝚗 𝚔𝚊𝚕𝚒~ 🐾
${borderLeft} 𝙶𝚊𝚔 𝚞𝚜𝚊𝚑 𝚔𝚒𝚗𝚎𝚛𝚓𝚊 𝚗𝚊𝚗𝚐𝚒𝚜 𝚢𝚊 😿
${footer}`

          await sock.sendMessage(update.id, {
            text: goodbyeMessage,
            mentions: [participant]
          })
        }
      }
    } catch (err) {
      console.error('❌ Error saat handle welcome/leave:', err)
    }
  })
}

module.exports = { handler, setupGroupEvents }