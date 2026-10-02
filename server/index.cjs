require('dotenv').config()

const express = require('express')
const cors = require('cors')

const app = express()

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NiveshShield API',
  })
})

app.post('/api/analyze', async (req, res) => {
  try {
    const { message, language } = req.body

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'A message is required.',
      })
    }

    if (message.length > 10000) {
      return res.status(400).json({
        error: 'Message exceeds the 10,000 character limit.',
      })
    }

    console.log('Analysis request received:', {
      language,
      characters: message.length,
    })

    // AI integration will be added in the next step.
    return res.json({
      status: 'demo',
      message:
        'Backend is connected. AI analysis will be added in the next step.',
    })
  } catch (error) {
    console.error('Analysis error:', error)

    return res.status(500).json({
      error: 'Unable to analyze the message.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`NiveshShield API running on http://localhost:${PORT}`)
})