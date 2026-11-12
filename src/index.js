const express = require('express')
const config = require('./config')
const logger = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

const app = express()

app.use(logger)
app.use(express.json())

app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Сервер запущен: http://localhost:${config.port}`)
})
