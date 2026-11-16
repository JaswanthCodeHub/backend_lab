const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const dbDir = path.join(__dirname, 'database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, {recursive: true})
}

const dbPath = path.join(dbDir, 'users.db')
const secretKey = 'MY_SECRET_KEY'
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        name TEXT,
        password TEXT
      );
    `)

    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`)
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

app.get('/', (request, response) => {
  response.status(200).json({
    message: 'Lab 4: Registration, Login and JWT Authentication',
    student: {
      name: 'Vemuri Jaswanth',
      registrationNumber: '252U1R1256',
      section: 'CSE-CORE-2E',
      faculty: 'Mr Yugandhar Gurjalwar',
      college: 'Aurora Deemed-to-be-University'
    },
    status: 'Online',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login'
    }
  })
})

app.get('/register', (request, response) => {
  response.status(200).json({
    message: 'Register endpoint is active. Send a POST request with JSON body to register a user.',
    method: 'POST',
    endpoint: '/register',
    sampleRequestBody: {
      username: 'jaswanth',
      name: 'Vemuri Jaswanth',
      password: 'pass123'
    }
  })
})

app.post('/register', async (request, response) => {
  try {
    const {username, name, password} = request.body

    if (!username || !name || !password) {
      return response.status(400).send('Username, name and password are required')
    }

    const selectUserQuery = 'SELECT * FROM user WHERE username = ?;'
    const existingUser = await db.get(selectUserQuery, [username])

    if (existingUser !== undefined) {
      return response.status(400).send('Username already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const createUserQuery = 'INSERT INTO user (username, name, password) VALUES (?, ?, ?);'
    await db.run(createUserQuery, [username, name, hashedPassword])

    response.status(201).send('User registered successfully')
  } catch (error) {
    response.status(500).send('Unable to register user')
  }
})

app.get('/login', (request, response) => {
  response.status(200).json({
    message: 'Login endpoint is active. Send a POST request with JSON body to login and receive a JWT token.',
    method: 'POST',
    endpoint: '/login',
    sampleRequestBody: {
      username: 'jaswanth',
      password: 'pass123'
    }
  })
})

app.post('/login', async (request, response) => {
  try {
    const {username, password} = request.body

    if (!username || !password) {
      return response.status(400).send('Username and password are required')
    }

    const selectUserQuery = 'SELECT * FROM user WHERE username = ?;'
    const user = await db.get(selectUserQuery, [username])

    if (user === undefined) {
      return response.status(400).send('Invalid username')
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password)

    if (!isPasswordMatched) {
      return response.status(400).send('Invalid password')
    }

    const payload = {username: username}
    const jwtToken = jwt.sign(payload, secretKey)

    response.status(200).json({jwt_token: jwtToken})
  } catch (error) {
    response.status(500).send('Unable to login')
  }
})

app.use((request, response) => {
  response.status(404).send('Page not found')
})

initializeDBAndServer()
