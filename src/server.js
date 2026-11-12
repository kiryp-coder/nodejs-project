const app = require('./app')
const config = require('./config')
const { startEmailWorker } = require('./workers/emailWorker')

startEmailWorker()

app.listen(config.port, () => {
  console.log(`Сервер запущен: http://localhost:${config.port}`)
})
