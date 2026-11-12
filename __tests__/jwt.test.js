const { generateTokens, verifyAccessToken, verifyRefreshToken } = require('../src/utils/jwt')

const user = { id: 7, email: 'unit@example.com', role: 'USER' }

describe('Утилита JWT (unit)', () => {
  test('access token содержит id, email и role пользователя', () => {
    const { accessToken } = generateTokens(user)
    const payload = verifyAccessToken(accessToken)

    expect(payload.id).toBe(user.id)
    expect(payload.email).toBe(user.email)
    expect(payload.role).toBe(user.role)
  })

  test('refresh token нельзя проверить секретом access token', () => {
    const { refreshToken } = generateTokens(user)

    expect(verifyRefreshToken(refreshToken).id).toBe(user.id)
    expect(() => verifyAccessToken(refreshToken)).toThrow()
  })

  test('поддельный токен не проходит проверку', () => {
    expect(() => verifyAccessToken('not.a.real.token')).toThrow()
  })
})
