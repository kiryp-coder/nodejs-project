const express = require('express')
const Joi = require('joi')
const prisma = require('../db')
const authenticate = require('../middleware/auth')
const { requirePermission } = require('../middleware/rbac')
const { validate, validateId } = require('../middleware/validate')

const router = express.Router()

const changeRoleSchema = Joi.object({
  role: Joi.string().valid('USER', 'MODERATOR', 'ADMIN').required()
})

router.use(authenticate)

router.patch(
  '/users/:id/role',
  requirePermission('assign:roles'),
  validateId,
  validate(changeRoleSchema),
  async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.id },
      data: { role: req.validated.role }
    })

    res.json({ data: user })
  }
)

module.exports = router
