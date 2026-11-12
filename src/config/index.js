const dotenv = require('dotenv')

dotenv.config({ quiet: true })

function getRequiredVariable(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`В .env не задана переменная ${name}`)
  }

  return value
}

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessSecret: getRequiredVariable('JWT_ACCESS_SECRET'),
    refreshSecret: getRequiredVariable('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  queuePrefix: process.env.QUEUE_PREFIX || 'bull',
  reminderDelayMs: Number(process.env.REMINDER_DELAY_MS) || 24 * 60 * 60 * 1000
}

module.exports = config
