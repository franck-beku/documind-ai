import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach token automatically on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  me: () => api.get('/auth/me'),
}

// ── DOCUMENTS ─────────────────────────────────────────────────────
export const documentsAPI = {
  upload:  (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  list:    ()        => api.get('/documents/'),
  get:     (id)      => api.get(`/documents/${id}`),
  delete:  (id)      => api.delete(`/documents/${id}`),
  status:  (id)      => api.get(`/documents/${id}/status`),
}

// ── ANALYSIS ──────────────────────────────────────────────────────
export const analysisAPI = {
  get:  (docId)              => api.get(`/analysis/${docId}`),
  ask:  (docId, question)    => api.post(`/analysis/${docId}/ask`, { question }),
}

// ── ADMIN ─────────────────────────────────────────────────────────
export const adminAPI = {
  stats:     ()    => api.get('/admin/stats'),
  documents: ()    => api.get('/admin/documents'),
  users:     ()    => api.get('/admin/users'),
  delete:    (id)  => api.delete(`/admin/documents/${id}`),
}

export default api