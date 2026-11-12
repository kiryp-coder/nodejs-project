const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'password123'

async function main() {
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const alice = await prisma.user.create({
    data: { email: 'alice@example.com', name: 'Alice', password: passwordHash, role: 'ADMIN' }
  })

  await prisma.user.create({
    data: { email: 'mod@example.com', name: 'Moderator', password: passwordHash, role: 'MODERATOR' }
  })

  const bob = await prisma.user.create({
    data: { email: 'bob@example.com', name: 'Bob', password: passwordHash }
  })

  await prisma.post.create({
    data: {
      title: 'Знакомство с Node.js',
      content: 'Node.js — среда выполнения JavaScript на сервере.',
      published: true,
      authorId: alice.id,
      tags: { connectOrCreate: [{ where: { name: 'nodejs' }, create: { name: 'nodejs' } }] }
    }
  })

  await prisma.post.create({
    data: {
      title: 'Prisma и PostgreSQL',
      content: 'Как подключить базу данных через Prisma.',
      published: true,
      authorId: alice.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nodejs' }, create: { name: 'nodejs' } },
          { where: { name: 'prisma' }, create: { name: 'prisma' } }
        ]
      }
    }
  })

  await prisma.post.create({
    data: {
      title: 'Черновик про Express',
      content: 'Пока не дописан.',
      published: false,
      authorId: bob.id
    }
  })

  console.log(`Тестовые данные добавлены: alice (ADMIN), mod (MODERATOR), bob (USER), пароль у всех ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
