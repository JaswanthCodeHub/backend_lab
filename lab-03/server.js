const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'database', 'bookStore.db')
let db = null

const sendError = (response, statusCode, message) => {
  response.status(statusCode).json({message})
}

const isNonEmptyString = value =>
  typeof value === 'string' && value.trim().length > 0

const isNumeric = value =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  Number.isFinite(Number(value))

const parseIntegerQuery = (value, defaultValue, name, minimum) => {
  if (value === undefined) return {value: defaultValue}
  const parsedValue = Number(value)
  if (!Number.isInteger(parsedValue) || parsedValue < minimum) {
    return {error: `${name} must be an integer greater than or equal to ${minimum}`}
  }
  return {value: parsedValue}
}

const initializeDBAndServer = async () => {
  try {
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, {recursive: true})
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `)

    const countRow = await db.get('SELECT COUNT(*) as count FROM book;')
    if (countRow.count === 0) {
      await db.exec(`
        INSERT INTO book (title, author, price, pages) VALUES
        ('Wings of Fire', 'A.P.J. Abdul Kalam', 250, 180),
        ('The Alchemist', 'Paulo Coelho', 300, 200),
        ('Atomic Habits', 'James Clear', 450, 320),
        ('Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 240),
        ('Ikigai', 'Hector Garcia', 280, 190),
        ('Think and Grow Rich', 'Napoleon Hill', 320, 250),
        ('Deep Work', 'Cal Newport', 400, 280),
        ('The Power of Habit', 'Charles Duhigg', 380, 300),
        ('Zero to One', 'Peter Thiel', 290, 210),
        ('The Psychology of Money', 'Morgan Housel', 350, 250);
      `)
    }

    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`)
    })
  } catch (error) {
    console.error(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

// GET / root endpoint with API directory & student metadata
app.get('/', (request, response) => {
  response.status(200).json({
    message: 'Lab 3: REST API, Query Parameters, Validation, and Debugging',
    student: {
      name: 'Vemuri Jaswanth',
      registrationNumber: '252U1R1256',
      section: 'CSE-CORE-2E',
      faculty: 'Mr Yugandhar Gurjalwar',
      college: 'Aurora Deemed-to-be-University'
    },
    status: 'Online',
    endpoints: {
      getAllBooks: 'GET /books',
      getBookById: 'GET /books/:bookId',
      createBook: 'POST /books',
      updateBook: 'PUT /books/:bookId',
      deleteBook: 'DELETE /books/:bookId'
    }
  })
})

// GET /books with title search, sorting, pagination and price range
app.get('/books', async (request, response) => {
  try {
    const {
      search_q = '',
      order_by = 'title',
      order = 'ASC',
      min_price,
      max_price
    } = request.query

    const allowedOrderBy = ['id', 'title', 'author', 'price', 'pages']
    const normalizedOrder = String(order).toUpperCase()

    if (!allowedOrderBy.includes(order_by)) {
      return sendError(response, 400, 'order_by must be one of: id, title, author, price, pages')
    }

    if (!['ASC', 'DESC'].includes(normalizedOrder)) {
      return sendError(response, 400, 'order must be ASC or DESC')
    }

    const limitResult = parseIntegerQuery(request.query.limit, 10, 'limit', 1)
    const offsetResult = parseIntegerQuery(request.query.offset, 0, 'offset', 0)

    if (limitResult.error) return sendError(response, 400, limitResult.error)
    if (offsetResult.error) return sendError(response, 400, offsetResult.error)

    const conditions = []
    const values = []

    if (String(search_q).trim() !== '') {
      conditions.push('title LIKE ?')
      values.push(`%${String(search_q).trim()}%`)
    }

    if (min_price !== undefined) {
      if (!isNumeric(min_price)) return sendError(response, 400, 'min_price must be numeric')
      conditions.push('price >= ?')
      values.push(Number(min_price))
    }

    if (max_price !== undefined) {
      if (!isNumeric(max_price)) return sendError(response, 400, 'max_price must be numeric')
      conditions.push('price <= ?')
      values.push(Number(max_price))
    }

    if (min_price !== undefined && max_price !== undefined && Number(min_price) > Number(max_price)) {
      return sendError(response, 400, 'min_price cannot be greater than max_price')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const getBooksQuery = `
      SELECT * FROM book
      ${whereClause}
      ORDER BY ${order_by} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `

    values.push(limitResult.value, offsetResult.value)
    const books = await db.all(getBooksQuery, values)
    response.status(200).json(books)
  } catch (error) {
    sendError(response, 500, 'Unable to retrieve books')
  }
})

// GET /books/:bookId
app.get('/books/:bookId', async (request, response) => {
  try {
    const {bookId} = request.params
    if (!Number.isInteger(Number(bookId)) || Number(bookId) < 1) {
      return sendError(response, 400, 'bookId must be a positive integer')
    }

    const book = await db.get('SELECT * FROM book WHERE id = ?;', [Number(bookId)])
    if (book === undefined) return sendError(response, 404, 'Book not found')
    response.status(200).json(book)
  } catch (error) {
    sendError(response, 500, 'Unable to retrieve the book')
  }
})

// POST /books
app.post('/books', async (request, response) => {
  try {
    const {title, author, price, pages = 0} = request.body

    if (!isNonEmptyString(title)) {
      return sendError(response, 400, 'title is required and must be a non-empty string')
    }
    if (!isNonEmptyString(author)) {
      return sendError(response, 400, 'author is required and must be a non-empty string')
    }
    if (!isNumeric(price)) {
      return sendError(response, 400, 'price is required and must be numeric')
    }
    if (!isNumeric(pages) || Number(pages) < 0) {
      return sendError(response, 400, 'pages must be a non-negative number')
    }

    const result = await db.run(
      'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);',
      [title.trim(), author.trim(), Number(price), Number(pages)]
    )

    response.status(201).json({
      message: 'Book added successfully',
      bookId: result.lastID
    })
  } catch (error) {
    sendError(response, 500, 'Unable to add the book')
  }
})

// PUT /books/:bookId
app.put('/books/:bookId', async (request, response) => {
  try {
    const {bookId} = request.params
    const {title, author, price, pages = 0} = request.body

    if (!Number.isInteger(Number(bookId)) || Number(bookId) < 1) {
      return sendError(response, 400, 'bookId must be a positive integer')
    }
    if (!isNonEmptyString(title)) {
      return sendError(response, 400, 'title is required and must be a non-empty string')
    }
    if (!isNonEmptyString(author)) {
      return sendError(response, 400, 'author is required and must be a non-empty string')
    }
    if (!isNumeric(price)) {
      return sendError(response, 400, 'price is required and must be numeric')
    }
    if (!isNumeric(pages) || Number(pages) < 0) {
      return sendError(response, 400, 'pages must be a non-negative number')
    }

    const result = await db.run(
      `UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;`,
      [title.trim(), author.trim(), Number(price), Number(pages), Number(bookId)]
    )

    if (result.changes === 0) return sendError(response, 404, 'Book not found')
    response.status(200).json({message: 'Book updated successfully'})
  } catch (error) {
    sendError(response, 500, 'Unable to update the book')
  }
})

// DELETE /books/:bookId
app.delete('/books/:bookId', async (request, response) => {
  try {
    const {bookId} = request.params
    if (!Number.isInteger(Number(bookId)) || Number(bookId) < 1) {
      return sendError(response, 400, 'bookId must be a positive integer')
    }

    const result = await db.run('DELETE FROM book WHERE id = ?;', [Number(bookId)])
    if (result.changes === 0) return sendError(response, 404, 'Book not found')
    response.status(200).json({message: 'Book deleted successfully'})
  } catch (error) {
    sendError(response, 500, 'Unable to delete the book')
  }
})

app.use((request, response) => {
  sendError(response, 404, 'Route not found')
})

initializeDBAndServer()
module.exports = app
