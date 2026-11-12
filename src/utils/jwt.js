const jwt = require('jsonwebtoken')
const config = require('../config')

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role }

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn
  })

  const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  })

  return { accessToken, refreshToken }
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret)
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret)
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken }
