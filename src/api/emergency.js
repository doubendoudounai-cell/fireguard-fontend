import request from '@/utils/request'

// 1. 获取应急事件列表 (带分页和条件查询)
export const getEmergencyList = (params) => request.get('/api/v1/emergency', { params })

// 2. 获取应急事件详情
export const getEmergencyDetail = (id) => request.get(`/api/v1/emergency/${id}`)

// 3. 一键报警 (通常是移动端或硬件触发，大屏一般只看，但也放这里备用)
export const triggerOneClickAlarm = (data) => request.post('/api/v1/emergency/one-click', data, {
  timeout: 60000
})

// 4. 派发应急事件
export const dispatchEmergency = (id, data) => request.post(`/api/v1/emergency/${id}/dispatch`, data)

// 5. 关闭应急事件
export const closeEmergency = (id, data) => request.post(`/api/v1/emergency/${id}/close`, data)
