import request from '@/utils/request'

// 1. 获取设备列表 (总)
export const getDeviceList = (page = 1, size = 20) => {
  return request.get('/api/v1/devices', { params: { page, size } })
}

// 2. 获取最新传感器快照 (分)
export const getLatestSensors = (deviceCode) => {
  return request.get(`/api/v1/devices/${deviceCode}/latest-sensors`)
}

// 3. 获取传感器历史趋势 (史)
export const getSensorHistory = (deviceCode, sensorType, limit = 50) => {
  return request.get(`/api/v1/devices/${deviceCode}/sensor-history`, {
    params: { sensorType, limit }
  })
}

export const getLatestVehiclePosition = (vehicleCode) => {
  return request.get(`/api/v1/vehicles/${vehicleCode}/position/latest`)
}

export const getVehiclePositionHistory = (vehicleCode, params) => {
  return request.get(`/api/v1/vehicles/${vehicleCode}/position/history`, { params })
}

// 获取车库当前地图元数据和底图
export const getGarageMap = (garageCode) => {
  return request.get(`/api/v1/garages/${garageCode}/map/current`)
}
