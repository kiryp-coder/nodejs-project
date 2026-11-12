const bcrypt = require('bcryptjs')
const prisma = require('../db')

function askForLogin(res) {
  res.set('WWW-Authenticate', 'Basic realm="Admin", charset="UTF-8"')
  return res.status(401).send('Войдите как администратор (email и пароль)')
}

async function adminBasicAuth(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Basic ')) {
    return askForLogin(res)
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8')
  const separatorIndex = decoded.indexOf(':')
  const email = decoded.slice(0, separatorIndex)
  const password = decoded.slice(separatorIndex + 1)

  const user = await prisma.user.findUnique({
    where: { email: email },
    omit: { password: false }
  })

  const isPasswordCorrect = user ? await bcrypt.compare(password, user.password) : false

  if (!isPasswordCorrect || user.role !== 'ADMIN') {
    return askForLogin(res)
  }

  next()
}

module.exports = adminBasicAuth
