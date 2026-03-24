/**
 * src/services/api.js
 * Central axios instance for all API calls.
 * Automatically attaches the JWT token from localStorage.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// No global 401 interceptor. We want components to handle errors gracefully
// and not aggressively log users out.


export default api

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
}

export const dungeonApi = {
  start: (floor) => api.post('/api/dungeon/start', { floor }),
  getActive: () => api.get('/api/dungeon/active'),
  getLevel: () => api.get('/api/dungeon/level'),
  move: (direction) => api.post('/api/dungeon/move', { direction }),
  combatStart: () => api.post('/api/dungeon/combat/start'),
  combatAction: (action) => api.post('/api/dungeon/combat/action', { action }),
  openChest: () => api.post('/api/dungeon/chest/open'),
  visitShop: () => api.post('/api/dungeon/shop/visit'),
  nextFloor: () => api.post('/api/dungeon/next-floor'),
  end: (status) => api.post('/api/dungeon/end', { status }),
}

