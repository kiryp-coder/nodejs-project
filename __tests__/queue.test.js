const { app, prisma, request, emailQueue, clearDatabase, closeConnections } = require('./helpers')
const { processEmailJob } = require('../src/workers/emailWorker')

beforeEach(async () => {
  await clearDatabase()
  await emailQueue.obliterate({ force: true })
})

afterAll(async () => {
  await closeConnections()
})

describe('Очередь писем', () => {
  test('регистрация ставит в очередь welcome сразу и reminder через 24 часа', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'Queue User', email: 'queue@example.com', password: 'password123' })

    const userId = response.body.data.user.id

    const waitingJobs = await emailQueue.getWaiting()
    const welcomeJob = waitingJobs.find((job) => job.name === 'welcome')
    expect(welcomeJob.data.userId).toBe(userId)

    const reminderJob = await emailQueue.getJob(`reminder-${userId}`)
    expect(reminderJob.name).toBe('reminder')
    expect(reminderJob.opts.delay).toBe(24 * 60 * 60 * 1000)
    expect(await reminderJob.getState()).toBe('delayed')
  })

  test('воркер берёт имя и email пользователя из базы', async () => {
    const user = await prisma.user.create({
      data: { name: 'Worker User', email: 'worker@example.com', password: 'hash' }
    })

    const result = await processEmailJob({ id: '1', name: 'welcome', data: { userId: user.id } })

    expect(result).toEqual({ sent: true, to: 'worker@example.com' })
  })

  test('воркер не отправляет письмо удалённому пользователю', async () => {
    const result = await processEmailJob({ id: '2', name: 'reminder', data: { userId: 999999 } })

    expect(result).toEqual({ sent: false })
  })
})
