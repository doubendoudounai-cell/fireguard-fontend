import request from '@/utils/request'

export const sendEmailCode = (email, type) => {
  return request.post('/api/auth/verify-code', null, {
    params: {
      email: email,
      type: type
    }
  })
}

export const registerAccount = (username, password, email, code) => {
  return request.post('/api/auth/account', {
    username: username,
    password: password,
    email: email,
    code: code
  })
}

export const login = (username, password) => {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  return request.post('/api/auth/login', params)
}

export const logout = () => {
  return request.post('/api/auth/logout')
}
