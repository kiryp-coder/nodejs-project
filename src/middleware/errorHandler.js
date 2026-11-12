const multer = require('multer')
const config = require('../config')

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `Файл больше ${config.maxImageSizeMb} МБ` })
    }
    return res.status(400).json({ error: `Ошибка загрузки файла: ${err.message}` })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' })
  }

  const status = err.status || 500
  const message = status === 500 ? 'Внутренняя ошибка сервера' : err.message

  if (status === 500) {
    console.error(err)
  }

  res.status(status).json({ error: message })
}

module.exports = errorHandler
