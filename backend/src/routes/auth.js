import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { getDb } from '../db'

const auth = new Hono()

auth.post('/register', async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) return c.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, 400)

    const db = await getDb(c.env.MONGODB_URI)
    const users = db.collection('users')
    
    const existing = await users.findOne({ username })
    if (existing) return c.json({ error: 'Tài khoản đã tồn tại' }, 400)
    
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)
    
    await users.insertOne({ username, password: hashedPassword, createdAt: new Date() })
    return c.json({ message: 'Đăng ký thành công' }, 201)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) return c.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, 400)

    const db = await getDb(c.env.MONGODB_URI)
    const users = db.collection('users')
    
    const user = await users.findOne({ username })
    if (!user) return c.json({ error: 'Sai tài khoản hoặc mật khẩu' }, 400)
    
    const isMatch = bcrypt.compareSync(password, user.password)
    if (!isMatch) return c.json({ error: 'Sai tài khoản hoặc mật khẩu' }, 400)
    
    const secret = c.env.JWT_SECRET || 'questly-secret-key-123'
    const token = await sign({ 
      id: user._id, 
      username: user.username, 
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 
    }, secret)
    
    return c.json({ message: 'Đăng nhập thành công', token, user: { username: user.username } })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

auth.post('/logout', (c) => {
  return c.json({ message: 'Đăng xuất thành công' })
})

export default auth
