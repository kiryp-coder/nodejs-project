const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()

  const alice = await prisma.user.create({
    data: { email: 'alice@example.com', name: 'Alice', role: 'ADMIN' }
  })

  const bob = await prisma.user.create({
    data: { email: 'bob@example.com', name: 'Bob' }
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

  console.log('Тестовые данные добавлены: 2 пользователя, 3 поста')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
