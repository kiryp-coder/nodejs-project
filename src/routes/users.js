const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcryptjs')
const prisma = require('../db')
const authenticate = require('../middleware/auth')
const { requirePermission } = require('../middleware/rbac')
const { validate, validateId } = require('../middleware/validate')

const router = express.Router()

const SALT_ROUNDS = 10
const roles = ['USER', 'MODERATOR', 'ADMIN']

const usersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid(...roles)
})

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2).max(100)
}).min(1)

router.use(authenticate)

router.get('/', requirePermission('read:users'), validate(usersQuerySchema, 'query'), async (req, res) => {
  const { page, limit } = req.validated

  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    skip: (page - 1) * limit,
    take: limit
  })
  const total = await prisma.user.count()

  res.json({
    data: users,
    meta: { total, page, limit, pages: Math.ceil(total / limit) }
  })
})

router.get('/:id', requirePermission('read:users'), validateId, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.id },
    include: {
      posts: { orderBy: { createdAt: 'desc' } }
    }
  })

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  res.json({ data: user })
})

router.post('/', requirePermission('manage:users'), validate(createUserSchema), async (req, res) => {
  const data = req.validated
  data.password = await bcrypt.hash(data.password, SALT_ROUNDS)

  const user = await prisma.user.create({ data: data })
  res.status(201).json({ data: user })
})

router.patch('/:id', requirePermission('manage:users'), validateId, validate(updateUserSchema), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.id },
    data: req.validated
  })
  res.json({ data: user })
})

router.delete('/:id', requirePermission('manage:users'), validateId, async (req, res) => {
  await prisma.user.delete({ where: { id: req.id } })
  res.status(204).send()
})

module.exports = router
