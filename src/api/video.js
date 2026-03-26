import request from '@/utils/request'

export const getStreamList = () => request.get('/api/video/streams')

export const getPlayUrl = (cameraId) => request.get(`/api/video/streams/${cameraId}/play-url`)

export const getPlayInfo = (cameraId) => request.get(`/api/video/streams/${cameraId}/play-info`)

export const playWebRtc = (cameraId, offerSdp) => request.post(`/api/video/webrtc/play?cameraId=${encodeURIComponent(cameraId)}`, offerSdp, {
  headers: {
    'Content-Type': 'application/sdp'
  }
})

export const takeSnapshot = (cameraId) => request.post(`/api/video/streams/${cameraId}/snapshot`)
