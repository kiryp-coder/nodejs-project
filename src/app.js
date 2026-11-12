const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express')
const config = require('./config')
const swaggerDocument = require('./config/swagger')
const logger = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const adminBasicAuth = require('./middleware/adminBasicAuth')
const { BOARD_PATH, boardRouter } = require('./queues/board')
const authRouter = require('./routes/auth')
const adminRouter = require('./routes/admin')
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

const app = express()

if (config.trustProxy) {
  app.set('trust proxy', 1)
}

app.use('/api/docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use(BOARD_PATH, helmet({ contentSecurityPolicy: false }), adminBasicAuth, boardRouter)

app.use(helmet())
app.use(logger)
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

app.use(errorHandler)

module.exports = app
