import request from '@/utils/request'

// 1. 获取 AI 识别事件列表
export const getAiEventList = (params) => {
  return request({
    url: '/api/v1/ai/events',
    method: 'get',
    params: params
  })
}

// 2. 🌟 获取 AI 识别事件详情 (你极有可能是漏写了这个，或者没 export！)
export const getAiEventDetail = (id) => {
  return request({
    url: `/api/v1/ai/events/${id}`,
    method: 'get'
  })
}
