const { app, prisma, request, clearDatabase } = require('./helpers')

const newUser = { name: 'Test User', email: 'test@example.com', password: 'password123' }

beforeEach(async () => {
  await clearDatabase()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Регистрация', () => {
  test('успешная регистрация возвращает 201, пользователя без пароля и токен', async () => {
    const response = await request(app).post('/auth/register').send(newUser)

    expect(response.status).toBe(201)
    expect(response.body.data.user.email).toBe(newUser.email)
    expect(response.body.data.user.password).toBeUndefined()
    expect(response.body.data.accessToken).toBeDefined()
    expect(response.headers['set-cookie'][0]).toMatch(/refreshToken=.*HttpOnly/)
  })

  test('пароль хранится в базе в виде хэша', async () => {
    await request(app).post('/auth/register').send(newUser)

    const saved = await prisma.user.findUnique({
      where: { email: newUser.email },
      omit: { password: false }
    })

    expect(saved.password).not.toBe(newUser.password)
    expect(saved.password).toMatch(/^\$2[aby]\$/)
  })

  test('повторная регистрация с тем же email возвращает 409', async () => {
    await request(app).post('/auth/register').send(newUser)
    const response = await request(app).post('/auth/register').send(newUser)

    expect(response.status).toBe(409)
  })
})

describe('Логин', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send(newUser)
  })

  test('успешный логин возвращает 200 и access token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: newUser.email, password: newUser.password })

    expect(response.status).toBe(200)
    expect(response.body.data.accessToken).toBeDefined()
  })

  test('неверный пароль возвращает 401', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: newUser.email, password: 'wrong-password' })

    expect(response.status).toBe(401)
  })
})

describe('Защищённый маршрут /auth/me', () => {
  test('с токеном возвращает текущего пользователя', async () => {
    const register = await request(app).post('/auth/register').send(newUser)
    const token = register.body.data.accessToken

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.email).toBe(newUser.email)
  })

  test('без токена возвращает 401', async () => {
    const response = await request(app).get('/auth/me')

    expect(response.status).toBe(401)
  })
})

describe('Refresh и logout', () => {
  test('refresh по cookie выдаёт новый access token, logout очищает cookie', async () => {
    const agent = request.agent(app)
    await agent.post('/auth/register').send(newUser)

    const refresh = await agent.post('/auth/refresh')
    expect(refresh.status).toBe(200)
    expect(refresh.body.data.accessToken).toBeDefined()

    const logout = await agent.post('/auth/logout')
    expect(logout.status).toBe(200)

    const refreshAfterLogout = await agent.post('/auth/refresh')
    expect(refreshAfterLogout.status).toBe(401)
  })
})
