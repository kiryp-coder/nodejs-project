const dotenv = require('dotenv')

dotenv.config({ quiet: true })

const config = {
  port: Number(process.env.PORT) || 3000,
  uploadDir: process.env.UPLOAD_DIR || 'uploads/products',
  maxImageSizeMb: Number(process.env.MAX_IMAGE_SIZE_MB) || 2
}

module.exports = config
