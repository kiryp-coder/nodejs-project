const { Worker } = require('bullmq')
const prisma = require('../db')
const config = require('../config')
const connection = require('../queues/connection')
const { EMAIL_QUEUE_NAME } = require('../queues/emailQueue')

const emailSubjects = {
  welcome: 'Добро пожаловать в блог!',
  reminder: 'Напишите свой первый пост'
}

async function processEmailJob(job) {
  const user = await prisma.user.findUnique({ where: { id: job.data.userId } })

  if (!user) {
    console.log(`[email] Задача ${job.name} #${job.id}: пользователь ${job.data.userId} удалён, письмо не нужно`)
    return { sent: false }
  }

  const subject = emailSubjects[job.name]

  if (!subject) {
    throw new Error(`Неизвестный тип письма: ${job.name}`)
  }

  console.log(`[email] Письмо «${subject}» отправлено: ${user.name} <${user.email}>`)
  return { sent: true, to: user.email }
}

function startEmailWorker() {
  const worker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: connection,
    prefix: config.queuePrefix
  })

  worker.on('failed', (job, error) => {
    console.error(`[email] Задача ${job.name} #${job.id} упала: ${error.message}`)
  })

  console.log('Воркер очереди email запущен')
  return worker
}

module.exports = { startEmailWorker, processEmailJob }
