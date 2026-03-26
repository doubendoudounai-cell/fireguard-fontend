import request from '@/utils/request'

// 1. 发送邮箱验证码 (Query 参数)
export const sendEmailCode = (email, type) => request.post(`/api/auth/verify-code?email=${email}&type=${type}`)

// 2. 修改当前用户密码 (Body 参数: password, new_password)
export const updatePassword = (data) => request.put('/api/me/password', data)

// 3. 修改当前用户邮箱 (Body 参数: email, code)
export const updateEmail = (data) => request.put('/api/me/email', data)

// 4. 邮箱重置密码 (Body 参数: email, code, password)
export const resetPasswordByEmail = (data) => request.put('/api/auth/account/password', data)
