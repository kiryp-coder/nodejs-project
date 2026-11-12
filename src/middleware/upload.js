const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const config = require('../config')

fs.mkdirSync(config.uploadDir, { recursive: true })

const allowedImageTypes = ['image/jpeg', 'image/png']

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, config.uploadDir)
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    callback(null, crypto.randomUUID() + extension)
  }
})

function imageFilter(req, file, callback) {
  if (allowedImageTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    const error = new Error('Можно загружать только JPEG и PNG')
    error.status = 400
    callback(error)
  }
}

const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: config.maxImageSizeMb * 1024 * 1024 }
})

module.exports = uploadImage
