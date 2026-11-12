const prisma = require('../db')

const PERMISSIONS = {
  'read:posts': ['USER', 'MODERATOR', 'ADMIN'],
  'create:posts': ['USER', 'MODERATOR', 'ADMIN'],
  'update:any:posts': ['MODERATOR', 'ADMIN'],
  'delete:any:posts': ['MODERATOR', 'ADMIN'],
  'read:users': ['MODERATOR', 'ADMIN'],
  'manage:users': ['ADMIN'],
  'assign:roles': ['ADMIN']
}

function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission] || []
  return allowedRoles.includes(role)
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}

function requirePostOwnerOr(permission) {
  return async (req, res, next) => {
    const post = await prisma.post.findUnique({ where: { id: req.id } })

    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' })
    }

    const isOwner = post.authorId === req.user.id

    if (!isOwner && !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: 'Можно изменять только свои посты' })
    }

    next()
  }
}

module.exports = { PERMISSIONS, hasPermission, requirePermission, requirePostOwnerOr }
