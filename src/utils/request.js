import axios from 'axios'
import router from '@/router'

export const API_BASE_URL = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/+$/, '')

// ========== ???????? ==========
const TOKEN_KEY = 'sys_token'
const TOKEN_EXPIRE_KEY = 'sys_token_expire'
// ???????1 ?
const TOKEN_TTL = 24 * 60 * 60 * 1000

let authToken = null
let authExpire = 0

export function setAuthToken (token) {
  authToken = token
  authExpire = Date.now() + TOKEN_TTL
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXPIRE_KEY, String(authExpire))
}

export function clearAuthToken () {
  authToken = null
  authExpire = 0
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRE_KEY)
}

export function getAuthToken () {
  if (authToken && authExpire > Date.now()) return authToken

  const stored = localStorage.getItem(TOKEN_KEY)
  const expire = parseInt(localStorage.getItem(TOKEN_EXPIRE_KEY) || '0', 10)
  if (!stored || !expire || expire <= Date.now()) {
    clearAuthToken()
    return null
  }
  authToken = stored
  authExpire = expire
  return authToken
}

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

instance.interceptors.request.use(function (config) {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, function (error) {
  return Promise.reject(error)
})

instance.interceptors.response.use(function (response) {
  const res = response.data
  if (res.code !== 200) {
    const msg = (res.id ? `[${res.id}] ` : '') + (res.message || '????')
    return Promise.reject(msg)
  }
  return res
}, function (error) {
  const { response, config, message } = error || {}

  if (response) {
    const status = response.status
    if (status === 401) {
      clearAuthToken()
      if (router.currentRoute.path !== '/login') {
        router.push('/login').catch(() => {})
      }
    }

    const data = response.data || {}
    const msg = (data.id ? `[${data.id}] ` : '') + (data.message || `???? (${status})`)
    return Promise.reject(msg)
  }

  if (config && config.method === 'get' && !config.__retry) {
    config.__retry = true
    return instance(config)
  }

  return Promise.reject(message || '??????????')
})

export default instance
