const { app, request, closeConnections } = require('./helpers')
const swaggerDocument = require('../src/config/swagger')

afterAll(async () => {
  await closeConnections()
})

describe('Документация и служебные маршруты', () => {
  test('GET /health отвечает ok', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  test('Swagger UI открывается по /api/docs', async () => {
    const response = await request(app).get('/api/docs/')

    expect(response.status).toBe(200)
    expect(response.text).toContain('swagger-ui')
  })

  test('в документации описаны все маршруты API', () => {
    const expectedRoutes = [
      'post /auth/register',
      'post /auth/login',
      'post /auth/refresh',
      'post /auth/logout',
      'get /auth/me',
      'get /api/posts',
      'post /api/posts',
      'get /api/posts/{id}',
      'patch /api/posts/{id}',
      'delete /api/posts/{id}',
      'get /api/users',
      'post /api/users',
      'get /api/users/{id}',
      'patch /api/users/{id}',
      'delete /api/users/{id}',
      'patch /admin/users/{id}/role'
    ]

    for (const route of expectedRoutes) {
      const [method, path] = route.split(' ')
      expect(swaggerDocument.paths[path][method]).toBeDefined()
    }

    expect(Object.keys(swaggerDocument.components.schemas)).toEqual(
      expect.arrayContaining(['User', 'Post', 'Tag', 'Error', 'ValidationError'])
    )
  })
})
