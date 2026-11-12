const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const logger = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const authRouter = require('./routes/auth')
const adminRouter = require('./routes/admin')
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

const app = express()

app.use(helmet())
app.use(logger)
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

app.use(errorHandler)

module.exports = app
