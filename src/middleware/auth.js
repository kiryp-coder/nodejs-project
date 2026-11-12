const { verifyAccessToken } = require('../utils/jwt')

function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Нужна авторизация: передайте токен в заголовке Authorization' })
  }

  const token = header.slice('Bearer '.length)

  try {
    req.user = verifyAccessToken(token)
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк, обновите его через /auth/refresh' })
    }
    return res.status(401).json({ error: 'Недействительный токен' })
  }
}

module.exports = authenticate
