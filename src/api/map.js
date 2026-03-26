import request from '@/utils/request'

export const getMapList = (garageCode) => request.get(`/api/v1/garages/${garageCode}/maps`)

export const activateMap = (garageCode, mapId, mapVersion) => request.post(`/api/v1/garages/${garageCode}/maps/${mapId}/${mapVersion}/activate`)

export const uploadMap = (garageCode, formData) => request.post(`/api/v1/garages/${garageCode}/maps/upload`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  timeout: 30000
})

export const getRiskPoints = (garageCode, params) => request.get(`/api/v1/garages/${garageCode}/risk-points`, { params })

export const addRiskPoint = (garageCode, data) => request.post(`/api/v1/garages/${garageCode}/risk-points`, data)

export const updateRiskPoint = (garageCode, pointCode, data) => request.put(`/api/v1/garages/${garageCode}/risk-points/${pointCode}`, data)

export const deleteRiskPoint = (garageCode, pointCode) => request.delete(`/api/v1/garages/${garageCode}/risk-points/${pointCode}`)
