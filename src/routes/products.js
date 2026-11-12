const fs = require('fs/promises')
const express = require('express')
const Joi = require('joi')
const config = require('../config')
const validate = require('../middleware/validate')
const uploadImage = require('../middleware/upload')

const router = express.Router()

const categories = ['electronics', 'clothing', 'food', 'other']

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().greater(0).required(),
  category: Joi.string().valid(...categories).required(),
  stock: Joi.number().integer().min(0).default(0),
  description: Joi.string().max(500)
})

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  price: Joi.number().greater(0),
  category: Joi.string().valid(...categories),
  stock: Joi.number().integer().min(0),
  description: Joi.string().max(500)
}).min(1)

const productsQuerySchema = Joi.object({
  category: Joi.string().valid(...categories),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

const products = []
let nextId = 1

function createProduct(data) {
  const product = {
    id: nextId,
    name: data.name,
    price: data.price,
    category: data.category,
    stock: data.stock,
    description: data.description || null,
    imageUrl: null,
    createdAt: new Date().toISOString()
  }

  nextId++
  products.push(product)
  return product
}

createProduct({ name: 'Ноутбук', price: 75000, category: 'electronics', stock: 5 })
createProduct({ name: 'Наушники', price: 4500, category: 'electronics', stock: 20 })
createProduct({ name: 'Футболка', price: 1200, category: 'clothing', stock: 50 })
createProduct({ name: 'Куртка', price: 8900, category: 'clothing', stock: 7 })
createProduct({ name: 'Кофе в зёрнах', price: 950, category: 'food', stock: 30 })

function findProduct(req, res, next) {
  const id = Number(req.params.id)
  const product = products.find((item) => item.id === id)

  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' })
  }

  req.product = product
  next()
}

async function deleteImageFile(imageUrl) {
  if (!imageUrl) {
    return
  }

  const filePath = imageUrl.slice(1)
  await fs.rm(filePath, { force: true })
}

router.get('/', validate(productsQuerySchema, 'query'), (req, res) => {
  const { category, minPrice, maxPrice, page, limit } = req.validated

  let filtered = products

  if (category !== undefined) {
    filtered = filtered.filter((product) => product.category === category)
  }

  if (minPrice !== undefined) {
    filtered = filtered.filter((product) => product.price >= minPrice)
  }

  if (maxPrice !== undefined) {
    filtered = filtered.filter((product) => product.price <= maxPrice)
  }

  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  res.json({
    data: pageItems,
    total: filtered.length,
    page: page,
    limit: limit
  })
})

router.get('/:id', findProduct, (req, res) => {
  res.json({ data: req.product })
})

router.post('/', validate(createProductSchema), (req, res) => {
  const product = createProduct(req.validated)
  res.status(201).json({ data: product })
})

router.put('/:id', findProduct, validate(createProductSchema), (req, res) => {
  const product = req.product
  const data = req.validated

  product.name = data.name
  product.price = data.price
  product.category = data.category
  product.stock = data.stock
  product.description = data.description || null

  res.json({ data: product })
})

router.patch('/:id', findProduct, validate(updateProductSchema), (req, res) => {
  const product = req.product
  const data = req.validated

  if (data.name !== undefined) product.name = data.name
  if (data.price !== undefined) product.price = data.price
  if (data.category !== undefined) product.category = data.category
  if (data.stock !== undefined) product.stock = data.stock
  if (data.description !== undefined) product.description = data.description

  res.json({ data: product })
})

router.delete('/:id', findProduct, async (req, res) => {
  const index = products.indexOf(req.product)
  products.splice(index, 1)

  await deleteImageFile(req.product.imageUrl)

  res.status(204).send()
})

router.post('/:id/image', findProduct, uploadImage.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не передан. Отправьте картинку в поле image' })
  }

  await deleteImageFile(req.product.imageUrl)
  req.product.imageUrl = `/${config.uploadDir}/${req.file.filename}`

  res.json({ data: req.product })
})

module.exports = router
