const { execSync } = require('child_process')
const dotenv = require('dotenv')

module.exports = async function globalSetup() {
  dotenv.config({ path: '.env.test', override: true, quiet: true })

  execSync('npx prisma migrate deploy', {
    env: process.env,
    stdio: 'ignore'
  })
}
