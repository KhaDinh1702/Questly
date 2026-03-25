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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log(`[API Interceptor] Intercepting request to: ${config.url}`);
  console.log(`[API Interceptor] Token in localStorage:`, token ? 'YES (len: ' + token.length + ')' : 'NO');
  
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
       config.headers = config.headers || {};
       config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`[API Interceptor] Attached Authorization header`);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// No global 401 interceptor. We want components to handle errors gracefully
// and not aggressively log users out.


export default api

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
}

export const userApi = {
  getMe: () => api.get('/api/users/me'),
  getInventory: () => api.get('/api/users/me/inventory'),
  confirmClass: (selectedClass) => api.put('/api/users/me/class/confirm', { selectedClass }),
  confirmPath: (selectedPath) => api.put('/api/users/me/path/confirm', { selectedPath }),
  equipItem: (userItemId, slot) => api.put('/api/users/me/equip', { userItemId, slot }),
  unequipItem: (userItemId) => api.put('/api/users/me/unequip', { userItemId }),
  allocateStat: (statKey, amount = 1) => api.put('/api/users/me/stats/allocate', { statKey, amount }),
  getLeaderboard: (limit = 10) => api.get('/api/users/leaderboard', { params: { limit } }),
}

export const shopApi = {
  // GET /api/shop/items?type=...&class=...
  getItems: (params = {}) => api.get('/api/shop/items', { params }),
  buy: (itemId, quantity = 1) => api.post('/api/shop/buy', { itemId, quantity }),
  rollChest: () => api.post('/api/shop/chest/roll'),
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

export const paymentApi = {
  createPaymentUrl: (data) => api.post('/api/payment/create_payment_url', data),
}
