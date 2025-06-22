const fs = require('fs')
const path = './lib/db.json'
let db = { banned: [], whitelist: [], users: {}, groups: {} }

if (fs.existsSync(path)) {
  db = JSON.parse(fs.readFileSync(path))
}

module.exports = db