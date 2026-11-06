const express = require('express');
const app = express()
app.get('/', (request, response) => {
  response.send("Welcome to my server")
});

app.get('/about', (request, response) => {
  response.send({
    name: "Vemuri Jaswanth",
    setion: "CSE CORE 2E"
  })
});
app.get('/time', (request, response) => {
  response.send(new Date())
})
app.use((request, response) => {
  response.status(404).send("Page not found")
})
app.listen(3000);
