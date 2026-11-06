
const express = require('express')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'database', 'bookStore.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.get('/books/', async (request, response) => {
  const getBooksQuery = `
    SELECT * FROM book;
  `

  const books = await db.all(getBooksQuery)
  response.status(200).send(books)
})


app.get('/books/:bookId/', async (request, response) => {
  const { bookId } = request.params

  const getBookQuery = `
    SELECT * FROM book
    WHERE id = ?;
  `

  const book = await db.get(getBookQuery, [bookId])

  if (book === undefined) {
    response.status(404).send('Book Not Found')
  } else {
    response.status(200).send(book)
  }
})

app.post('/books/', async (request, response) => {
  const { title, author, price, pages } = request.body

  const addBookQuery = `
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?);
  `

  const result = await db.run(addBookQuery, [
    title,
    author,
    price,
    pages
  ])

  response.status(201).send({
    message: 'Book Added Successfully',
    bookId: result.lastID
  })
})

app.put('/books/:bookId/', async (request, response) => {
  const { bookId } = request.params
  const { title, author, price, pages } = request.body

  const updateBookQuery = `
    UPDATE book
    SET title = ?,
        author = ?,
        price = ?,
        pages = ?
    WHERE id = ?;
  `

  const result = await db.run(updateBookQuery, [
    title,
    author,
    price,
    pages,
    bookId
  ])

  if (result.changes === 0) {
    response.status(404).send('Book Not Found')
  } else {
    response.status(200).send('Book Updated Successfully')
  }
})

app.delete('/books/:bookId/', async (request, response) => {
  const { bookId } = request.params

  const deleteBookQuery = `
    DELETE FROM book
    WHERE id = ?;
  `

  const result = await db.run(deleteBookQuery, [bookId])

  if (result.changes === 0) {
    response.status(404).send('Book Not Found')
  } else {
    response.status(200).send('Book Deleted Successfully')
  }
})

app.listen(3000);