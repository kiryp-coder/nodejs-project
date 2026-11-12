const Redis = require('ioredis')
const config = require('../config')

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null
})

module.exports = connection
