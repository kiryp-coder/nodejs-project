function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' })
  }

  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? err.meta.target.join(', ') : 'поле'
    return res.status(409).json({ error: `Такое значение уже занято: ${fields}` })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Запись не найдена' })
  }

  if (err.code === 'P2003') {
    return res.status(409).json({ error: 'Нельзя выполнить: запись связана с другими данными' })
  }

  const status = err.status || 500
  const message = status === 500 ? 'Внутренняя ошибка сервера' : err.message

  if (status === 500) {
    console.error(err)
  }

  res.status(status).json({ error: message })
}

module.exports = errorHandler
