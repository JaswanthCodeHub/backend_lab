const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const fs = require('fs/promises')

const dbPath = path.join(__dirname, 'database', 'users.db')

async function initializeDatabase(filename = dbPath) {
  if (filename !== ':memory:') await fs.mkdir(path.dirname(filename), {recursive: true})
  const db = await open({filename, driver: sqlite3.Database})
  try {
    await db.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL
      );
    `)
    return db
  } catch (error) {
    await db.close()
    throw error
  }
}

module.exports = {initializeDatabase, dbPath}
