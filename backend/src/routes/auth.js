import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { getDb } from '../db'
import { getJwtSecret } from '../config/env'
import { hashPassword, verifyPassword } from '../helpers/crypto'
import { createUserDocument } from '../models/User'

const auth = new Hono()

auth.post('/register', async (c) => {
  try {
    const { username, password, email } = await c.req.json()
    if (!username || !password) {
      return c.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, 400)
    }

    const db    = await getDb(c)
    const users = db.collection('users')

    const existing = await users.findOne({ username })
    if (existing) return c.json({ error: 'Tài khoản đã tồn tại' }, 400)

    const hashedPassword = await hashPassword(password)

    const userDoc = createUserDocument({
      username,
      email: email ?? null,
      passwordHash: hashedPassword,
      selectedClass: null,
    })
    const { insertedId } = await users.insertOne(userDoc)

    const secret = getJwtSecret(c)
    const token = await sign({
      id:       insertedId.toString(),
      username,
      role:     'user',
      exp:      Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    }, secret)

    return c.json({
      message: 'Đăng ký thành công',
      token,
      user: { id: insertedId, username, role: 'user' },
    }, 201)
  } catch (error) {
    console.error('[register]', error)
    return c.json({ error: error.message }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) {
      return c.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, 400)
    }

    const db    = await getDb(c)
    const users = db.collection('users')

    const user = await users.findOne({ username })
    if (!user) return c.json({ error: 'Sai tài khoản hoặc mật khẩu' }, 400)

    const isMatch = await verifyPassword(password, user.password)
    if (!isMatch) return c.json({ error: 'Sai tài khoản hoặc mật khẩu' }, 400)

    const secret = getJwtSecret(c)
    if (!secret) return c.json({ error: 'Server misconfigured: JWT_SECRET missing' }, 500)

    const token = await sign({
      id:       user._id.toString(),
      username: user.username,
      role:     user.role ?? 'user',
      exp:      Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    }, secret)

    return c.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error('[login]', error)
    return c.json({ error: error.message }, 500)
  }
})

auth.post('/logout', (c) => {
  return c.json({ message: 'Đăng xuất thành công' })
})

export default auth
