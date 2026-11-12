const express = require('express')
const Joi = require('joi')
const prisma = require('../db')
const { validate, validateId } = require('../middleware/validate')

const router = express.Router()

const postsQuerySchema = Joi.object({
  search: Joi.string().trim().min(1),
  published: Joi.boolean(),
  authorId: Joi.number().integer().min(1),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

const tagsSchema = Joi.array().items(Joi.string().trim().min(1).max(50)).unique()

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().allow('', null),
  published: Joi.boolean().default(false),
  authorId: Joi.number().integer().min(1).required(),
  tags: tagsSchema.default([])
})

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  content: Joi.string().allow('', null),
  published: Joi.boolean(),
  tags: tagsSchema
}).min(1)

const includeAuthorAndTags = {
  author: { select: { id: true, name: true, email: true } },
  tags: true
}

function tagsToConnectOrCreate(tagNames) {
  return tagNames.map((name) => ({
    where: { name: name },
    create: { name: name }
  }))
}

router.get('/', validate(postsQuerySchema, 'query'), async (req, res) => {
  const { search, published, authorId, page, limit } = req.validated

  const where = {}

  if (search !== undefined) {
    where.title = { contains: search, mode: 'insensitive' }
  }

  if (published !== undefined) {
    where.published = published
  }

  if (authorId !== undefined) {
    where.authorId = authorId
  }

  const posts = await prisma.post.findMany({
    where: where,
    include: includeAuthorAndTags,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  })
  const total = await prisma.post.count({ where: where })

  res.json({
    data: posts,
    meta: { total, page, limit, pages: Math.ceil(total / limit) }
  })
})

router.get('/:id', validateId, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.id },
    include: includeAuthorAndTags
  })

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' })
  }

  res.json({ data: post })
})

router.post('/', validate(createPostSchema), async (req, res) => {
  const { title, content, published, authorId, tags } = req.validated

  const author = await prisma.user.findUnique({ where: { id: authorId } })

  if (!author) {
    return res.status(400).json({ error: `Автор с id ${authorId} не найден` })
  }

  const post = await prisma.post.create({
    data: {
      title: title,
      content: content,
      published: published,
      authorId: authorId,
      tags: { connectOrCreate: tagsToConnectOrCreate(tags) }
    },
    include: includeAuthorAndTags
  })

  res.status(201).json({ data: post })
})

router.patch('/:id', validateId, validate(updatePostSchema), async (req, res) => {
  const { title, content, published, tags } = req.validated

  const data = { title, content, published }

  if (tags !== undefined) {
    data.tags = {
      set: [],
      connectOrCreate: tagsToConnectOrCreate(tags)
    }
  }

  const post = await prisma.post.update({
    where: { id: req.id },
    data: data,
    include: includeAuthorAndTags
  })

  res.json({ data: post })
})

router.delete('/:id', validateId, async (req, res) => {
  await prisma.post.delete({ where: { id: req.id } })
  res.status(204).send()
})

module.exports = router
