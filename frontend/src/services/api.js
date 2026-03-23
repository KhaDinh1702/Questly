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
