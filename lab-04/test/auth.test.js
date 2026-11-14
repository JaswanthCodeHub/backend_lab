const {test} = require('node:test')
const assert = require('node:assert/strict')
const {once} = require('node:events')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {initializeDatabase} = require('../db')
const {createApp, JWT_SECRET} = require('../server')

test('Lab 04 real HTTP and SQLite integration', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bdf-lab04-'))
  const filename = path.join(directory, 'users.db')
  const db = await initializeDatabase(filename)
  const server = createApp(db).listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(async () => {
    await new Promise(resolve => server.close(resolve))
    await db.close()
    await fs.rm(directory, {recursive: true, force: true})
  })
  const base = `http://127.0.0.1:${server.address().port}`
  async function post(route, body, status) {
    const result = await fetch(base + route, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
    assert.equal(result.status, status)
    return result.json()
  }
  const user = {username: 'jaswanth', name: 'Jaswanth', password: 'Jaswanth123'}
  await t.test('registration returns 201 without credentials', async () => {
    assert.deepEqual(await post('/register', user, 201), {message: 'User registered successfully'})
  })
  await t.test('duplicate username returns 400', async () => {
    assert.deepEqual(await post('/register', user, 400), {message: 'Username already exists'})
  })
  await t.test('missing, empty and incorrect-type fields return 400', async () => {
    for (const field of ['username', 'name', 'password']) {
      for (const value of [undefined, '', '   ', 123, null, []]) {
        await post('/register', {...user, [field]: value}, 400)
      }
    }
    for (const field of ['username', 'password']) {
      for (const value of [undefined, '', '   ', 123, null, []]) {
        await post('/login', {...user, [field]: value}, 400)
      }
    }
    await post('/register', {}, 400)
    await post('/login', {}, 400)
  })
  await t.test('login token verifies and contains no password or hash', async () => {
    const result = await post('/login', user, 200)
    assert.deepEqual(Object.keys(result), ['jwt_token'])
    const payload = jwt.verify(result.jwt_token, JWT_SECRET, {algorithms: ['HS256']})
    assert.equal(payload.username, user.username)
    assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'username'])
    assert.equal(payload.exp - payload.iat, 3600)
    assert.throws(() => jwt.verify(result.jwt_token, 'wrong-signing-key'))
    assert.throws(() => jwt.verify(result.jwt_token, JWT_SECRET, {clockTimestamp: payload.exp + 1}))
  })
  await t.test('unknown username returns 400', async () => {
    assert.deepEqual(await post('/login', {...user, username: 'unknown'}, 400), {message: 'Unknown username'})
  })
  await t.test('wrong password returns 400', async () => {
    assert.deepEqual(await post('/login', {...user, password: 'Wrong123'}, 400), {message: 'Incorrect password'})
  })
  await t.test('persistent database contains bcrypt hash and required constraints', async () => {
    const secondConnection = await initializeDatabase(filename)
    try {
      const row = await secondConnection.get('SELECT * FROM users WHERE username = ?', [user.username])
      assert.notEqual(row.password, user.password)
      assert.equal(await bcrypt.compare(user.password, row.password), true)
      assert.equal(bcrypt.getRounds(row.password), 10)
      const columns = await secondConnection.all('PRAGMA table_info(users)')
      assert.equal(columns.find(column => column.name === 'id').pk, 1)
      for (const name of ['username', 'name', 'password']) assert.equal(columns.find(column => column.name === name).notnull, 1)
      await assert.rejects(secondConnection.run('INSERT INTO users (username,name,password) VALUES (?,?,?)', [user.username, 'Duplicate', row.password]), {code: 'SQLITE_CONSTRAINT'})
      assert.equal((await secondConnection.get('PRAGMA quick_check')).quick_check, 'ok')
    } finally { await secondConnection.close() }
  })
  await t.test('concurrent duplicate registrations allow exactly one insert', async () => {
    const statuses = await Promise.all([1, 2].map(() => fetch(base + '/register', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...user, username: 'race'})}).then(result => result.status)))
    assert.deepEqual(statuses.sort(), [201, 400])
  })
  await t.test('SQL injection is treated as a literal username', async () => {
    await post('/login', {...user, username: "' OR 1=1 --"}, 400)
    await post('/register', {...user, username: "literal'quote"}, 201)
    await post('/login', {...user, username: "literal'quote"}, 200)
  })
  await t.test('bcrypt byte limit handles Unicode safely', async () => {
    await post('/register', {...user, username: 'long', password: 'a'.repeat(73)}, 400)
    await post('/login', {...user, password: 'a'.repeat(73)}, 400)
    await post('/register', {...user, username: 'unicode', password: '€'.repeat(25)}, 400)
  })
  await t.test('malformed JSON, missing body, large body and 404 handled', async () => {
    const malformed = await fetch(base + '/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{'})
    assert.equal(malformed.status, 400)
    assert.deepEqual(await malformed.json(), {message: 'Invalid JSON request body'})
    assert.equal((await fetch(base + '/login', {method: 'POST'})).status, 400)
    const large = await fetch(base + '/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: 'a'.repeat(110000)})})
    assert.equal(large.status, 413)
    assert.equal((await fetch(base + '/absent')).status, 404)
    assert.equal((await fetch(base + '/api/health')).status, 200)
  })
  await t.test('database errors return generic 500 without SQL details', async () => {
    await db.exec('ALTER TABLE users RENAME TO users_backup')
    try {
      assert.deepEqual(await post('/login', user, 500), {message: 'Internal server error'})
      assert.deepEqual(await post('/register', user, 500), {message: 'Internal server error'})
    } finally { await db.exec('ALTER TABLE users_backup RENAME TO users') }
  })
  await t.test('database initialization failure rejects cleanly', async () => {
    await assert.rejects(initializeDatabase(path.join(filename, 'impossible.db')))
  })
})
