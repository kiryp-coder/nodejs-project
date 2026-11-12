const { Queue } = require('bullmq')
const connection = require('./connection')
const config = require('../config')

const EMAIL_QUEUE_NAME = 'email'

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: connection,
  prefix: config.queuePrefix,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500
  }
})

async function addRegistrationEmails(user) {
  await emailQueue.add('welcome', { userId: user.id })

  await emailQueue.add(
    'reminder',
    { userId: user.id },
    { delay: config.reminderDelayMs, jobId: `reminder-${user.id}` }
  )
}

async function closeEmailQueue() {
  await emailQueue.close()
  await connection.quit()
}

module.exports = { EMAIL_QUEUE_NAME, emailQueue, addRegistrationEmails, closeEmailQueue }
