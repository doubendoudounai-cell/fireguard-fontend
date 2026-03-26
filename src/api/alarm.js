import request from '@/utils/request'

// 1. 获取告警列表
export const getAlarmList = (page = 1, size = 50, status = '') => {
  return request.get('/api/v1/alerts', {
    params: { page, size, status: status === 'all' ? '' : status }
  })
}

export const getAlarmDetail = (alertId) => {
  return request.get(`/api/v1/alerts/${alertId}`)
}

export const getAlarmActions = (alertId) => {
  return request.get(`/api/v1/alerts/${alertId}/actions`)
}

// 2. 获取告警的取证证据列表
export const getAlarmEvidences = (alertId) => {
  return request.get(`/api/v1/alerts/${alertId}/evidences`)
}

// 3. 确认告警 (处理中)
export const ackAlarm = (alertId, remark = '前端手动确认') => {
  return request.post(`/api/v1/alerts/${alertId}/ack`, { remark })
}

// 4. 关闭告警 (已解决/误报申诉)
export const closeAlarm = (alertId, remark = '前端手动关闭') => {
  return request.post(`/api/v1/alerts/${alertId}/close`, { remark })
}
// 获取证据播放/访问链接
export const getEvidencePlayUrl = (id) => request.get(`/api/v1/evidences/${id}/play-url`)

// 重试生成证据
export const retryGenerateEvidence = (id) => request.post(`/api/v1/evidences/${id}/retry`)

// (注意：/api/v1/evidences/{id}/file 是文件流，前端通常直接把这个 URL 拼接给 img 的 src 即可，不需要写 axios 请求)
