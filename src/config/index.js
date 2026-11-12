const dotenv = require('dotenv')

dotenv.config({ quiet: true })

const config = {
  port: Number(process.env.PORT) || 3000
}

module.exports = config
