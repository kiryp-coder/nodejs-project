# Blog API

REST API блог-платформы на Node.js: пользователи, посты, теги, JWT-аутентификация, роли, фоновая очередь писем.

**Стек:** Node.js 24, Express 5, PostgreSQL 16 + Prisma 6, Redis 7 + BullMQ, Joi, JWT, bcrypt, Jest + Supertest, Swagger, Docker Compose.

## Возможности

- **3 связанные модели:** User → Post (один ко многим), Post ↔ Tag (многие ко многим)
- **CRUD** для постов и пользователей, поиск, фильтры и пагинация в списках
- **Аутентификация:** регистрация, вход, access token (15 минут) + refresh token (7 дней, httpOnly cookie)
- **Роли** USER / MODERATOR / ADMIN и проверка владельца поста
- **Безопасность:** helmet, rate limit на вход (10 попыток / 15 минут), лимит тела запроса 10 КБ, хэширование паролей
- **Очередь BullMQ:** при регистрации письмо-приветствие сразу и напоминание через 24 часа, панель Bull Board
- **Документация** Swagger UI на `/api/docs`
- **Тесты:** 27 тестов (Jest + Supertest)

## Запуск через Docker (одна команда)

Нужен установленный и запущенный Docker.

```bash
cp .env.example .env              # и поменять JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
docker compose up -d --build      # поднимет app, db (PostgreSQL) и redis
docker compose exec app npx prisma db seed   # (по желанию) тестовые данные
```

- API: http://localhost:3000
- Документация: http://localhost:3000/api/docs
- Очереди: http://localhost:3000/admin/queues (вход email и паролем администратора)

Миграции применяются автоматически при старте контейнера. Данные PostgreSQL и Redis хранятся в томах и не пропадают при перезапуске.

## Запуск для разработки

```bash
npm install
cp .env.example .env
npm run db:up        # только PostgreSQL и Redis в Docker
npm run migrate      # применить миграции
npm run seed         # тестовые данные
npm run dev          # сервер с перезапуском при изменениях
```

## Тесты

```bash
npm run db:up
npm test
```
Тесты используют отдельную базу `blog_test` и отдельный префикс очереди, рабочие данные не затрагиваются.

## Тестовые пользователи (после seed)

| Email | Пароль | Роль |
|---|---|---|
| alice@example.com | password123 | ADMIN |
| mod@example.com | password123 | MODERATOR |
| bob@example.com | password123 | USER |

## Эндпоинты

Защищённые маршруты требуют заголовок `Authorization: Bearer <accessToken>`.

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| GET | `/health` | все | Проверка работы сервера |
| POST | `/auth/register` | все | Регистрация |
| POST | `/auth/login` | все | Вход (rate limit) |
| POST | `/auth/refresh` | refresh cookie | Новый access token |
| POST | `/auth/logout` | все | Выход |
| GET | `/auth/me` | вошедший | Текущий пользователь |
| GET | `/api/posts` | вошедший | Список: `search`, `published`, `authorId`, `page`, `limit` |
| GET | `/api/posts/:id` | вошедший | Пост с автором и тегами |
| POST | `/api/posts` | вошедший | Создать пост (автор — текущий пользователь) |
| PATCH | `/api/posts/:id` | автор / MODERATOR / ADMIN | Изменить пост |
| DELETE | `/api/posts/:id` | автор / MODERATOR / ADMIN | Удалить пост |
| GET | `/api/users` | MODERATOR / ADMIN | Список: `page`, `limit` |
| GET | `/api/users/:id` | MODERATOR / ADMIN | Пользователь с постами |
| POST | `/api/users` | ADMIN | Создать пользователя |
| PATCH | `/api/users/:id` | ADMIN | Изменить email или имя |
| DELETE | `/api/users/:id` | ADMIN | Удалить пользователя |
| PATCH | `/admin/users/:id/role` | ADMIN | Сменить роль |
| GET | `/api/docs` | все | Swagger UI |
| GET | `/admin/queues` | ADMIN (Basic Auth) | Bull Board |

**Формат ответов:** успех — `{ "data": ... }` (списки — `{ "data": [...], "meta": { "total", "page", "limit", "pages" } }`), ошибка — `{ "error": "..." }`, ошибка валидации — `{ "error": "...", "details": [{ "field", "message" }] }`.

## Деплой (Render)

В репозитории есть `render.yaml`. На https://render.com: **New → Blueprint** → выбрать этот репозиторий. Render сам создаст веб-сервис, PostgreSQL и Redis (Key Value), сгенерирует JWT-секреты и при каждом запуске применит миграции.

## Структура

```
prisma/              схема, миграции, seed
src/
  config/            настройки (.env) и описание Swagger
  middleware/        auth, rbac, validate, errorHandler, logger, adminBasicAuth
  routes/            auth, admin, users, posts
  queues/            подключение к Redis, очередь email, Bull Board
  workers/           воркер очереди email
  utils/jwt.js       создание и проверка токенов
  app.js             сборка приложения
  server.js          запуск сервера и воркера
__tests__/           тесты Jest + Supertest
Dockerfile, docker-compose.yml, render.yaml
```
