function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    })

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({ error: 'Ошибка валидации', details })
    }

    req.validated = value
    next()
  }
}

function validateId(req, res, next) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id должен быть положительным целым числом' })
  }

  req.id = id
  next()
}

module.exports = { validate, validateId }
