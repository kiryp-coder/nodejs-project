const request = require('supertest')
const app = require('../src/app')
const prisma = require('../src/db')
const { generateTokens } = require('../src/utils/jwt')

async function clearDatabase() {
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()
}

async function registerUser(name, email, role) {
  const response = await request(app)
    .post('/auth/register')
    .send({ name: name, email: email, password: 'password123' })

  let user = response.body.data.user

  if (role) {
    user = await prisma.user.update({ where: { id: user.id }, data: { role: role } })
  }

  const { accessToken } = generateTokens(user)

  return { user: user, token: accessToken }
}

module.exports = { app, prisma, request, clearDatabase, registerUser }
