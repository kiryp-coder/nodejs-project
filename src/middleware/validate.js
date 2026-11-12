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

module.exports = validate
