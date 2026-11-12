const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const prisma = require('../db')
const config = require('../config')
const { validate } = require('../middleware/validate')
const authenticate = require('../middleware/auth')
const { generateTokens, verifyRefreshToken } = require('../utils/jwt')

const router = express.Router()

const SALT_ROUNDS = 10
const REFRESH_COOKIE_NAME = 'refreshToken'
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  path: '/auth'
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут' }
})

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(100).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

function sendTokens(res, status, user) {
  const tokens = generateTokens(user)

  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...refreshCookieOptions,
    maxAge: SEVEN_DAYS_IN_MS
  })

  res.status(status).json({
    data: { user: user, accessToken: tokens.accessToken }
  })
}

router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, name, password } = req.validated

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: { email: email, name: name, password: passwordHash }
  })

  sendTokens(res, 201, user)
})

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated

  const userWithPassword = await prisma.user.findUnique({
    where: { email: email },
    omit: { password: false }
  })

  const isPasswordCorrect = userWithPassword
    ? await bcrypt.compare(password, userWithPassword.password)
    : false

  if (!isPasswordCorrect) {
    return res.status(401).json({ error: 'Неверный email или пароль' })
  }

  const user = userWithPassword
  delete user.password

  sendTokens(res, 200, user)
})

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME]

  if (!refreshToken) {
    return res.status(401).json({ error: 'Нет refresh token, войдите заново' })
  }

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    return res.status(401).json({ error: 'Refresh token недействителен, войдите заново' })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } })

  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден, войдите заново' })
  }

  sendTokens(res, 200, user)
})

router.post('/logout', (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions)
  res.json({ data: { message: 'Вы вышли из системы' } })
})

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  res.json({ data: user })
})

module.exports = router
