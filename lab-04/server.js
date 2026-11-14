const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {initializeDatabase} = require('./db')

// Public classroom-only constant; never use this key for production.
// Moving configuration to .env is reserved for Lab 08.
const JWT_SECRET = 'bdf-lab04-classroom-demo-only-not-for-production'
const SALT_ROUNDS = 10
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0

function createApp(db) {
  const app = express()
  app.use(express.json())
  app.get('/', (request, response) => {
    response.json({message: 'Lab 04: Registration, Login and JWT', status: 'online'})
  })
  app.get('/api/health', async (request, response) => {
    await db.get('SELECT 1')
    response.json({status: 'OK'})
  })

  app.post('/register', async (request, response) => {
    const {username, name, password} = request.body || {}
    if (![username, name, password].every(isNonEmptyString)) {
      return response.status(400).json({message: 'username, name and password are required non-empty strings'})
    }
    // bcrypt only uses the first 72 bytes. Reject longer inputs instead of truncating.
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return response.status(400).json({message: 'password must not exceed 72 UTF-8 bytes'})
    }
    const normalizedUsername = username.trim()
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [normalizedUsername])
    if (existingUser) return response.status(400).json({message: 'Username already exists'})

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    try {
      await db.run('INSERT INTO users (username, name, password) VALUES (?, ?, ?)',
        [normalizedUsername, name.trim(), hashedPassword])
    } catch (error) {
      // The UNIQUE constraint also prevents duplicates from concurrent requests.
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('users.username')) {
        return response.status(400).json({message: 'Username already exists'})
      }
      throw error
    }
    response.status(201).json({message: 'User registered successfully'})
  })

  app.post('/login', async (request, response) => {
    const {username, password} = request.body || {}
    if (![username, password].every(isNonEmptyString)) {
      return response.status(400).json({message: 'username and password are required non-empty strings'})
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return response.status(400).json({message: 'password must not exceed 72 UTF-8 bytes'})
    }
    const user = await db.get('SELECT username, password FROM users WHERE username = ?', [username.trim()])
    if (!user) return response.status(400).json({message: 'Unknown username'})
    if (!(await bcrypt.compare(password, user.password))) {
      return response.status(400).json({message: 'Incorrect password'})
    }
    const token = jwt.sign({username: user.username}, JWT_SECRET, {algorithm: 'HS256', expiresIn: '1h'})
    response.json({jwt_token: token})
  })

  app.use((request, response) => response.status(404).json({message: 'Route not found'}))
  // Express 5 forwards rejected async handlers here. Never return SQL or credentials.
  app.use((error, request, response, next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({message: 'Invalid JSON request body'})
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({message: 'Request body too large'})
    }
    response.status(500).json({message: 'Internal server error'})
  })
  return app
}

async function startServer() {
  const db = await initializeDatabase()
  const app = createApp(db)
  const port = process.env.PORT || 5002
  const server = app.listen(port, () => console.log(`Server running at http://localhost:${port}`))
  server.on('error', async () => {
    console.error('Unable to start server. Check that PORT is available.')
    await db.close()
    process.exitCode = 1
  })
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(async () => { await db.close() }))
  }
  return {server, db}
}

if (require.main === module) {
  startServer().catch(() => {
    console.error('Unable to initialize database. Check the database directory and permissions.')
    process.exitCode = 1
  })
}

module.exports = {createApp, startServer, JWT_SECRET}
