const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Yuuchan is alive!')
})

app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Server listening...')
})

require('./index')
