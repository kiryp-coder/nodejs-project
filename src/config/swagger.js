function jsonBody(schemaName) {
  return {
    required: true,
    content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } }
  }
}

function jsonResponse(description, schema) {
  return { description: description, content: { 'application/json': { schema: schema } } }
}

function dataResponse(description, schemaName) {
  return jsonResponse(description, {
    type: 'object',
    properties: { data: { $ref: `#/components/schemas/${schemaName}` } }
  })
}

function listResponse(description, schemaName) {
  return jsonResponse(description, {
    type: 'object',
    properties: {
      data: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    }
  })
}

function errorResponse(description) {
  return jsonResponse(description, { $ref: '#/components/schemas/Error' })
}

const validationErrorResponse = jsonResponse('Ошибка валидации', {
  $ref: '#/components/schemas/ValidationError'
})

const noContentResponse = { description: 'Удалено, тело ответа пустое' }

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'id записи',
  schema: { type: 'integer', minimum: 1 }
}

const pageParameter = {
  name: 'page',
  in: 'query',
  description: 'Номер страницы',
  schema: { type: 'integer', minimum: 1, default: 1 }
}

const limitParameter = {
  name: 'limit',
  in: 'query',
  description: 'Сколько записей на странице',
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
}

const withToken = [{ bearerAuth: [] }]

const schemas = {
  Role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      email: { type: 'string', format: 'email', example: 'alice@example.com' },
      name: { type: 'string', example: 'Alice' },
      role: { $ref: '#/components/schemas/Role' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  UserWithPosts: {
    allOf: [
      { $ref: '#/components/schemas/User' },
      {
        type: 'object',
        properties: { posts: { type: 'array', items: { $ref: '#/components/schemas/PostShort' } } }
      }
    ]
  },
  Tag: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'nodejs' }
    }
  },
  PostShort: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      title: { type: 'string', example: 'Знакомство с Node.js' },
      content: { type: 'string', nullable: true },
      published: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      authorId: { type: 'integer', example: 1 }
    }
  },
  Post: {
    allOf: [
      { $ref: '#/components/schemas/PostShort' },
      {
        type: 'object',
        properties: {
          author: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          },
          tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } }
        }
      }
    ]
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      total: { type: 'integer', example: 25, description: 'Сколько всего записей подходит под фильтры' },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      pages: { type: 'integer', example: 3, description: 'Сколько всего страниц' }
    }
  },
  Error: {
    type: 'object',
    properties: { error: { type: 'string', example: 'Запись не найдена' } }
  },
  ValidationError: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'Ошибка валидации' },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'email' },
            message: { type: 'string', example: '"email" must be a valid email' }
          }
        }
      }
    }
  },
  RegisterInput: {
    type: 'object',
    required: ['email', 'name', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'new@example.com' },
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'Новый пользователь' },
      password: { type: 'string', minLength: 6, maxLength: 100, example: 'password123' }
    }
  },
  LoginInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'alice@example.com' },
      password: { type: 'string', example: 'password123' }
    }
  },
  AuthResult: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
      accessToken: { type: 'string', description: 'JWT на 15 минут. Refresh token приходит в httpOnly cookie' }
    }
  },
  CreatePostInput: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200, example: 'Мой пост' },
      content: { type: 'string', nullable: true, example: 'Текст поста' },
      published: { type: 'boolean', default: false },
      tags: { type: 'array', items: { type: 'string' }, example: ['nodejs', 'docker'] }
    }
  },
  UpdatePostInput: {
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      content: { type: 'string', nullable: true },
      published: { type: 'boolean' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Заменяет все теги поста' }
    }
  },
  CreateUserInput: {
    type: 'object',
    required: ['email', 'name', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      password: { type: 'string', minLength: 6, maxLength: 100 },
      role: { $ref: '#/components/schemas/Role' }
    }
  },
  UpdateUserInput: {
    type: 'object',
    minProperties: 1,
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 2, maxLength: 100 }
    }
  },
  ChangeRoleInput: {
    type: 'object',
    required: ['role'],
    properties: { role: { $ref: '#/components/schemas/Role' } }
  }
}

const paths = {
  '/health': {
    get: {
      tags: ['Служебное'],
      summary: 'Проверка, что сервер работает',
      responses: {
        200: jsonResponse('Сервер работает', {
          type: 'object',
          properties: { status: { type: 'string', example: 'ok' } }
        })
      }
    }
  },
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Регистрация (роль USER), письма ставятся в очередь',
      requestBody: jsonBody('RegisterInput'),
      responses: {
        201: dataResponse('Пользователь создан, выдан access token и refresh cookie', 'AuthResult'),
        400: validationErrorResponse,
        409: errorResponse('Email уже занят')
      }
    }
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Вход. Не больше 10 попыток за 15 минут',
      requestBody: jsonBody('LoginInput'),
      responses: {
        200: dataResponse('Вход выполнен, выдан access token и refresh cookie', 'AuthResult'),
        400: validationErrorResponse,
        401: errorResponse('Неверный email или пароль'),
        429: errorResponse('Слишком много попыток входа')
      }
    }
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Новый access token по refresh token из cookie',
      security: [{ refreshCookie: [] }],
      responses: {
        200: dataResponse('Выдана новая пара токенов', 'AuthResult'),
        401: errorResponse('Нет refresh token или он недействителен')
      }
    }
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Выход: удалить refresh cookie',
      responses: {
        200: jsonResponse('Выход выполнен', {
          type: 'object',
          properties: {
            data: { type: 'object', properties: { message: { type: 'string', example: 'Вы вышли из системы' } } }
          }
        })
      }
    }
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Текущий пользователь',
      security: withToken,
      responses: {
        200: dataResponse('Текущий пользователь', 'User'),
        401: errorResponse('Нет токена или он недействителен')
      }
    }
  },
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'Список постов: поиск, фильтры, пагинация',
      security: withToken,
      parameters: [
        { name: 'search', in: 'query', description: 'Поиск по заголовку без учёта регистра', schema: { type: 'string' } },
        { name: 'published', in: 'query', description: 'Только опубликованные / только черновики', schema: { type: 'boolean' } },
        { name: 'authorId', in: 'query', description: 'Посты одного автора', schema: { type: 'integer', minimum: 1 } },
        pageParameter,
        limitParameter
      ],
      responses: {
        200: listResponse('Страница постов', 'Post'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена')
      }
    },
    post: {
      tags: ['Posts'],
      summary: 'Создать пост (автор — текущий пользователь)',
      security: withToken,
      requestBody: jsonBody('CreatePostInput'),
      responses: {
        201: dataResponse('Пост создан, теги привязаны через connectOrCreate', 'Post'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена')
      }
    }
  },
  '/api/posts/{id}': {
    parameters: [idParameter],
    get: {
      tags: ['Posts'],
      summary: 'Пост с автором и тегами',
      security: withToken,
      responses: {
        200: dataResponse('Пост', 'Post'),
        400: errorResponse('Некорректный id'),
        401: errorResponse('Нет токена'),
        404: errorResponse('Пост не найден')
      }
    },
    patch: {
      tags: ['Posts'],
      summary: 'Изменить пост: свой — любой роли, чужой — MODERATOR и ADMIN',
      security: withToken,
      requestBody: jsonBody('UpdatePostInput'),
      responses: {
        200: dataResponse('Пост изменён', 'Post'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Чужой пост и нет прав'),
        404: errorResponse('Пост не найден')
      }
    },
    delete: {
      tags: ['Posts'],
      summary: 'Удалить пост: свой — любой роли, чужой — MODERATOR и ADMIN',
      security: withToken,
      responses: {
        204: noContentResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Чужой пост и нет прав'),
        404: errorResponse('Пост не найден')
      }
    }
  },
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'Список пользователей (MODERATOR, ADMIN)',
      security: withToken,
      parameters: [pageParameter, limitParameter],
      responses: {
        200: listResponse('Страница пользователей', 'User'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Недостаточно прав')
      }
    },
    post: {
      tags: ['Users'],
      summary: 'Создать пользователя (ADMIN)',
      security: withToken,
      requestBody: jsonBody('CreateUserInput'),
      responses: {
        201: dataResponse('Пользователь создан', 'User'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Недостаточно прав'),
        409: errorResponse('Email уже занят')
      }
    }
  },
  '/api/users/{id}': {
    parameters: [idParameter],
    get: {
      tags: ['Users'],
      summary: 'Пользователь с постами, новые сверху (MODERATOR, ADMIN)',
      security: withToken,
      responses: {
        200: dataResponse('Пользователь', 'UserWithPosts'),
        401: errorResponse('Нет токена'),
        403: errorResponse('Недостаточно прав'),
        404: errorResponse('Пользователь не найден')
      }
    },
    patch: {
      tags: ['Users'],
      summary: 'Изменить email или имя (ADMIN)',
      security: withToken,
      requestBody: jsonBody('UpdateUserInput'),
      responses: {
        200: dataResponse('Пользователь изменён', 'User'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Недостаточно прав'),
        404: errorResponse('Пользователь не найден'),
        409: errorResponse('Email уже занят')
      }
    },
    delete: {
      tags: ['Users'],
      summary: 'Удалить пользователя без постов (ADMIN)',
      security: withToken,
      responses: {
        204: noContentResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Недостаточно прав'),
        404: errorResponse('Пользователь не найден'),
        409: errorResponse('У пользователя есть посты')
      }
    }
  },
  '/admin/users/{id}/role': {
    parameters: [idParameter],
    patch: {
      tags: ['Admin'],
      summary: 'Сменить роль пользователя (ADMIN)',
      security: withToken,
      requestBody: jsonBody('ChangeRoleInput'),
      responses: {
        200: dataResponse('Роль изменена', 'User'),
        400: validationErrorResponse,
        401: errorResponse('Нет токена'),
        403: errorResponse('Недостаточно прав'),
        404: errorResponse('Пользователь не найден')
      }
    }
  }
}

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Blog API',
    version: '1.0.0',
    description:
      'Блог-платформа: пользователи, посты, теги, JWT-аутентификация, роли, очередь писем.\n\n' +
      'Как пользоваться: выполните POST /auth/login (alice@example.com / password123 после seed), ' +
      'скопируйте accessToken, нажмите Authorize и вставьте токен.\n\n' +
      'Панель очередей Bull Board: /admin/queues (вход email и паролем администратора).'
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Регистрация, вход, токены' },
    { name: 'Posts', description: 'Посты' },
    { name: 'Users', description: 'Пользователи' },
    { name: 'Admin', description: 'Администрирование' },
    { name: 'Служебное' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refreshToken' }
    },
    schemas: schemas
  },
  paths: paths
}

module.exports = swaggerDocument
