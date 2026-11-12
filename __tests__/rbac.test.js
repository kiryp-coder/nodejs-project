const { app, prisma, request, clearDatabase, closeConnections, registerUser } = require('./helpers')

let owner
let otherUser
let moderator
let admin
let post

beforeEach(async () => {
  await clearDatabase()

  owner = await registerUser('Owner', 'owner@example.com')
  otherUser = await registerUser('Other', 'other@example.com')
  moderator = await registerUser('Moderator', 'mod@example.com', 'MODERATOR')
  admin = await registerUser('Admin', 'admin@example.com', 'ADMIN')

  const response = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ title: 'Пост владельца', tags: ['test'] })

  post = response.body.data
})

afterAll(async () => {
  await closeConnections()
})

describe('Посты: владелец и права', () => {
  test('автором поста становится тот, кто его создал', () => {
    expect(post.authorId).toBe(owner.user.id)
  })

  test('владелец удаляет свой пост — 204', async () => {
    const response = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${owner.token}`)

    expect(response.status).toBe(204)
  })

  test('другой пользователь не может удалить чужой пост — 403', async () => {
    const response = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${otherUser.token}`)

    expect(response.status).toBe(403)
  })

  test('другой пользователь не может изменить чужой пост — 403', async () => {
    const response = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send({ title: 'Взлом' })

    expect(response.status).toBe(403)
  })

  test('модератор может изменить любой пост', async () => {
    const response = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${moderator.token}`)
      .send({ published: true })

    expect(response.status).toBe(200)
    expect(response.body.data.published).toBe(true)
  })
})

describe('Пользователи и роли', () => {
  test('USER не видит список пользователей — 403', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${owner.token}`)

    expect(response.status).toBe(403)
  })

  test('MODERATOR видит список пользователей', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${moderator.token}`)

    expect(response.status).toBe(200)
    expect(response.body.meta.total).toBe(4)
  })

  test('только ADMIN меняет роль', async () => {
    const byModerator = await request(app)
      .patch(`/admin/users/${owner.user.id}/role`)
      .set('Authorization', `Bearer ${moderator.token}`)
      .send({ role: 'ADMIN' })

    expect(byModerator.status).toBe(403)

    const byAdmin = await request(app)
      .patch(`/admin/users/${owner.user.id}/role`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'MODERATOR' })

    expect(byAdmin.status).toBe(200)
    expect(byAdmin.body.data.role).toBe('MODERATOR')
  })
})

describe('Безопасность', () => {
  test('helmet добавляет защитные заголовки', async () => {
    const response = await request(app).get('/api/posts')

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
  })

  test('тело больше 10 КБ отклоняется — 413', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'x'.repeat(20000), email: 'big@example.com', password: 'password123' })

    expect(response.status).toBe(413)
  })
})
