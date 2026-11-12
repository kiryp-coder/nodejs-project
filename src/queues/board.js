const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const { emailQueue } = require('./emailQueue')

const BOARD_PATH = '/admin/queues'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath(BOARD_PATH)

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter
})

module.exports = { BOARD_PATH, boardRouter: serverAdapter.getRouter() }
