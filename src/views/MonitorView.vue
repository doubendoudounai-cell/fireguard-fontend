<template>
  <div class="monitor-view">
    <div class="main-screen tech-card">
      <video
        ref="mainVideoPlayer"
        class="video-stream"
        autoplay
        muted
        playsinline
        controls
        v-show="!isCameraOffline"
      ></video>

      <div v-if="isCameraOffline" class="offline-placeholder">
        <i class="el-icon-video-camera-solid"></i>
        <h2>NO SIGNAL</h2>
        <p>物理摄像头暂未接入 / 正在等待视频流</p>
      </div>

      <div class="status-badge" v-if="currentCamera">
        <span class="dot red-pulse"></span>
        <span class="cam-name">{{ currentCamera.cameraId }}</span>
        <span class="dot white"></span>
        <span class="live-text">LIVE</span>
      </div>

      <div class="env-hud">
        <div class="hud-item">
          <i class="el-icon-sunny"></i>
          <span class="hud-val">{{ envData.temp }}<small>°C</small></span>
        </div>
        <div class="hud-divider"></div>
        <div class="hud-item warning">
          <i class="el-icon-wind-power"></i>
          <span class="hud-val">{{ envData.smoke }}<small>ppm</small></span>
        </div>
      </div>

      <div class="action-bar">
        <button class="icon-btn" @click="handleSnapshot" title="抓拍截图">
          <i class="el-icon-camera"></i>
        </button>
      </div>

      <div class="radar-thumbnail">
        <div class="radar-scan-box">
          <div v-if="displayRadarMap && displayRadarMap.imageUrl" class="radar-map-shell">
            <img :src="toAbsoluteUrl(displayRadarMap.imageUrl)" class="radar-map-image" alt="实时定位地图">
            <div
              v-for="point in radarTrailPoints"
              :key="point.key"
              class="radar-trail-dot"
              :style="buildRadarTrailStyle(point)"
            ></div>
            <div
              v-if="isRadarPositionMappable"
              :key="radarMarkerKey"
              class="radar-marker"
              :style="buildRadarMarkerStyle()"
              :title="`X: ${radarData.x} / Y: ${radarData.y}`"
            >
              <span class="radar-marker-dot"></span>
            </div>
          </div>
          <div v-else class="radar-placeholder">
            <i class="el-icon-location-outline"></i>
            <span>实时定位视图</span>
          </div>
        </div>
        <div class="radar-info">
          <div class="coord-item"><span>X</span> {{ radarData.x }}</div>
          <div class="coord-item"><span>Y</span> {{ radarData.y }}</div>
          <div class="coord-item"><span>地图</span> {{ radarData.mapVersion || '--' }}</div>
        </div>
      </div>
    </div>

    <div class="sub-screens" v-if="cameras.length > 0">
      <div
        v-for="cam in cameras"
        :key="cam.cameraId"
        class="sub-item tech-card"
        :class="{ active: currentCamera && currentCamera.cameraId === cam.cameraId }"
        @click="switchCamera(cam)"
      >
        <div class="sub-placeholder">
          <i class="el-icon-video-camera"></i>
          <span>{{ cam.online ? '点击切换画面' : '等待视频流' }}</span>
        </div>
        <div class="sub-label">{{ cam.cameraId }}</div>
      </div>
    </div>

    <el-dialog title="现场抓拍取证" :visible.sync="snapshotVisible" width="50%" center append-to-body>
      <img v-if="currentSnapshotUrl" :src="currentSnapshotUrl" alt="抓拍画面" style="width: 100%; border-radius: 8px;">
      <span slot="footer" class="dialog-footer">
        <el-button @click="snapshotVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/utils/request'
import { sensorWs } from '@/utils/websocket'
import { getStreamList, getPlayInfo, playWebRtc, takeSnapshot } from '@/api/video'
import mpegts from 'mpegts.js'
import { getDeviceList, getLatestSensors, getSensorHistory, getLatestVehiclePosition, getGarageMap } from '@/api/device'

export default {
  name: 'MonitorView',
  data () {
    return {
      currentVehicleCode: 'veh-g01-001',
      envData: { temp: '--', smoke: '--' },
      historyData: {
        timeAxis: [],
        tempSeries: [],
        smokeSeries: []
      },
      radarMap: null,
      radarData: {
        x: '0.00',
        y: '0.00',
        mapId: '',
        mapVersion: '',
        yaw: '0.00'
      },
      radarTrailHistory: [],
      pendingRadarPosition: null,
      pendingSensorPayloads: {},
      realtimeFlushTimer: null,
      positionPollTimer: null,
      activePlayRequestId: 0,
      currentPlayingCameraId: '',
      switchingCamera: false,
      bootstrapping: false,
      visibilityHandler: null,
      pageHideHandler: null,
      cameras: [],
      currentCamera: null,
      flvPlayer: null,
      rtcPeer: null,
      isCameraOffline: false,
      snapshotVisible: false,
      currentSnapshotUrl: ''
    }
  },
  mounted () {
    this.visibilityHandler = this.handlePageVisibilityChange.bind(this)
    this.pageHideHandler = this.handlePageHide.bind(this)
    document.addEventListener('visibilitychange', this.visibilityHandler)
    window.addEventListener('pagehide', this.pageHideHandler)
    this.bootstrapMonitorPage()
  },
  beforeRouteLeave (to, from, next) {
    this.teardownMonitorPage()
    next()
  },
  beforeDestroy () {
    this.teardownMonitorPage()
  },
  computed: {
    displayRadarMap () {
      if (this.radarMap && this.radarMap.imageUrl && this.isRadarPositionInsideMap(this.radarMap)) {
        return this.radarMap
      }
      return this.buildDynamicRadarMap()
    },
    isRadarPositionMappable () {
      if (!this.displayRadarMap) return false
      const resolution = Number(this.displayRadarMap.resolution)
      const width = Number(this.displayRadarMap.width)
      const height = Number(this.displayRadarMap.height)
      const x = Number(this.radarData.x)
      const y = Number(this.radarData.y)
      return Number.isFinite(resolution) && resolution > 0 &&
        Number.isFinite(width) && width > 0 &&
        Number.isFinite(height) && height > 0 &&
        Number.isFinite(x) && Number.isFinite(y)
    },
    radarTrailPoints () {
      const total = this.radarTrailHistory.length || 1
      return this.radarTrailHistory.map((point, index) => ({
        ...point,
        key: `${point.ts || index}-${index}`,
        opacity: Math.min(0.75, 0.22 + ((index + 1) / total) * 0.45),
        scale: 0.45 + ((index + 1) / total) * 0.45
      }))
    },
    radarMarkerKey () {
      return `${this.radarData.x}-${this.radarData.y}-${this.radarData.mapVersion}-${this.radarData.yaw}`
    }
  },
  watch: {
    '$route.query.vehicleCode' (value, oldValue) {
      if (value === oldValue) return
      this.handleRouteVehicleChange()
    }
  },
  methods: {
    async bootstrapMonitorPage () {
      if (this.bootstrapping) return
      this.bootstrapping = true
      try {
        const preferredVehicleCode = this.getRequestedVehicleCode()
        if (preferredVehicleCode) {
          this.currentVehicleCode = preferredVehicleCode
        }
        this.setupWebSocket()
        await this.initDashboard()
        await this.fetchInitialPosition()
        await this.initVideoStreams()
      } finally {
        this.bootstrapping = false
      }
    },
    teardownMonitorPage () {
      this.activePlayRequestId += 1
      this.switchingCamera = false
      this.currentPlayingCameraId = ''
      this.cleanupMediaPlayer()
      if (this.realtimeFlushTimer) {
        clearTimeout(this.realtimeFlushTimer)
        this.realtimeFlushTimer = null
      }
      this.stopPositionPolling()
      sensorWs.unsubscribe('/topic/vehicle-position/all')
      sensorWs.unsubscribe('/topic/sensor/all')
      if (this.visibilityHandler) {
        document.removeEventListener('visibilitychange', this.visibilityHandler)
        this.visibilityHandler = null
      }
      if (this.pageHideHandler) {
        window.removeEventListener('pagehide', this.pageHideHandler)
        this.pageHideHandler = null
      }
    },
    isMonitorRouteActive () {
      return this.$route && this.$route.path === '/monitor' && !(typeof document !== 'undefined' && document.hidden)
    },
    isPlayRequestStale (requestId) {
      return requestId !== this.activePlayRequestId || !this.isMonitorRouteActive()
    },
    handlePageHide () {
      this.activePlayRequestId += 1
      this.currentPlayingCameraId = ''
      this.cleanupMediaPlayer()
    },
    handlePageVisibilityChange () {
      if (!this.isMonitorRouteActive()) {
        this.handlePageHide()
      }
    },
    normalizeErrorMessage (error, fallback = '操作失败') {
      if (!error) return fallback
      if (typeof error === 'string') return error
      if (error.message) return error.message
      if (error.response && error.response.data) {
        const data = error.response.data
        if (typeof data === 'string') return data
        if (data.message) return data.message
      }
      return fallback
    },
    canPlayFlv () {
      return !!mpegts && typeof mpegts.getFeatureList === 'function' && mpegts.getFeatureList().mseLivePlayback
    },
    getRequestedVehicleCode () {
      const value = this.$route && this.$route.query ? this.$route.query.vehicleCode : ''
      return this.normalizeVehicleCode(value)
    },
    normalizeVehicleCode (value) {
      const normalized = String(value || '').trim().toLowerCase()
      return /^veh-[a-z0-9]+-\d{3}$/.test(normalized) ? normalized : ''
    },
    pickPreferredCamera (cameraList) {
      const requestedVehicleCode = this.getRequestedVehicleCode()
      if (!requestedVehicleCode || !Array.isArray(cameraList) || cameraList.length === 0) return null
      const matchList = cameraList.filter(item => this.inferVehicleCodeFromCamera(item.cameraId) === requestedVehicleCode)
      if (!matchList.length) return null
      return matchList.find(item => item && item.online) || matchList[0]
    },
    pickDefaultCamera (cameraList) {
      if (!Array.isArray(cameraList) || cameraList.length === 0) return null
      return this.pickPreferredCamera(cameraList) ||
        cameraList.find(item => item && item.online) ||
        cameraList[0]
    },
    syncVehicleContextByCamera (cam) {
      const nextVehicleCode = this.inferVehicleCodeFromCamera(cam.cameraId)
      if (nextVehicleCode === this.currentVehicleCode) return
      this.currentVehicleCode = nextVehicleCode
      this.radarTrailHistory = []
      this.startPositionPolling()
      this.fetchRadarMap()
      this.fetchInitialPosition()
      this.fetchLatestSensors()
      this.fetchHistoryCharts()
    },
    pauseCurrentVideo () {
      const video = this.$refs.mainVideoPlayer
      if (!video) return
      try { video.pause() } catch (e) {}
      try { video.srcObject = null } catch (e) {}
      try { video.removeAttribute('src') } catch (e) {}
      try { video.load() } catch (e) {}
    },
    bindFlvPlayerError (requestId, reject) {
      return () => {
        if (this.isPlayRequestStale(requestId)) return
        this.currentPlayingCameraId = ''
        this.isCameraOffline = true
        this.cleanupMediaPlayer()
        reject(new Error('FLV 视频流播放失败'))
      }
    },
    toAbsoluteUrl (path) {
      if (!path) return ''
      if (/^https?:\/\//i.test(path)) return path
      return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
    },
    inferVehicleCodeFromCamera (cameraId) {
      const normalizedCameraId = String(cameraId || '').trim().toLowerCase()
      const matched = normalizedCameraId.match(/^cam-(veh-[a-z0-9]+-\d{3})-[a-z0-9]+$/)
      if (matched && matched[1]) {
        return matched[1]
      }
      return this.normalizeVehicleCode(this.currentVehicleCode) || this.getRequestedVehicleCode()
    },
    cleanupMediaPlayer () {
      if (this.flvPlayer) {
        try {
          this.flvPlayer.pause()
          this.flvPlayer.unload()
          this.flvPlayer.detachMediaElement()
          this.flvPlayer.destroy()
        } catch (e) {}
        this.flvPlayer = null
      }
      if (this.rtcPeer) {
        try {
          this.rtcPeer.ontrack = null
          this.rtcPeer.close()
        } catch (e) {}
        this.rtcPeer = null
      }
      this.pauseCurrentVideo()
    },
    async waitForIceGatheringComplete (peer) {
      if (!peer || peer.iceGatheringState === 'complete') return
      await new Promise((resolve) => {
        const handler = () => {
          if (peer.iceGatheringState === 'complete') {
            peer.removeEventListener('icegatheringstatechange', handler)
            resolve()
          }
        }
        peer.addEventListener('icegatheringstatechange', handler)
        setTimeout(() => {
          peer.removeEventListener('icegatheringstatechange', handler)
          resolve()
        }, 1500)
      })
    },
    async fetchInitialPosition () {
      try {
        const res = await getLatestVehiclePosition(this.currentVehicleCode)
        this.applyRadarPosition(res.data)
        await this.fetchRadarMap()
      } catch (error) {
        console.warn('获取初始位置失败，等待 WebSocket 推送...')
      }
    },
    async fetchRadarMap () {
      const garageCode = this.getGarageCodeFromVehicleCode(this.currentVehicleCode)
      if (!garageCode) {
        this.radarMap = null
        return
      }
      try {
        const res = await getGarageMap(garageCode)
        this.radarMap = res.data || null
      } catch (error) {
        this.radarMap = null
      }
    },
    applyRadarPosition (position) {
      if (!position || position.x === undefined || position.y === undefined) return
      const nextPosition = {
        x: Number(position.x),
        y: Number(position.y),
        ts: position.ts || new Date().toISOString()
      }
      if (Number.isFinite(nextPosition.x) && Number.isFinite(nextPosition.y)) {
        const trail = Array.isArray(this.radarTrailHistory) ? this.radarTrailHistory.slice() : []
        const lastPoint = trail[trail.length - 1]
        if (!lastPoint || Math.abs(lastPoint.x - nextPosition.x) > 0.001 || Math.abs(lastPoint.y - nextPosition.y) > 0.001) {
          trail.push(nextPosition)
        } else {
          trail[trail.length - 1] = nextPosition
        }
        this.radarTrailHistory = trail.slice(-8)
      }
      this.radarData.x = Number(position.x).toFixed(2)
      this.radarData.y = Number(position.y).toFixed(2)
      this.radarData.mapId = position.mapId || ''
      this.radarData.mapVersion = position.mapVersion || ''
      this.radarData.yaw = position.yaw !== undefined && position.yaw !== null ? Number(position.yaw).toFixed(2) : '0.00'
    },
    buildRadarMarkerStyle () {
      const map = this.displayRadarMap || {}
      const resolution = Number(map.resolution)
      const width = Number(map.width)
      const height = Number(map.height)
      const originX = Number(map.originX || 0)
      const originY = Number(map.originY || 0)
      const x = Number(this.radarData.x)
      const y = Number(this.radarData.y)
      if (!resolution || !width || !height || !Number.isFinite(x) || !Number.isFinite(y)) {
        return { display: 'none' }
      }
      const pixelX = (x - originX) / resolution
      const pixelY = height - ((y - originY) / resolution)
      const left = Math.min(Math.max((pixelX / width) * 100, 0), 100)
      const top = Math.min(Math.max((pixelY / height) * 100, 0), 100)
      return {
        left: `${left}%`,
        top: `${top}%`
      }
    },
    buildRadarTrailStyle (point) {
      const map = this.displayRadarMap || {}
      const resolution = Number(map.resolution)
      const width = Number(map.width)
      const height = Number(map.height)
      const originX = Number(map.originX || 0)
      const originY = Number(map.originY || 0)
      const x = Number(point && point.x)
      const y = Number(point && point.y)
      if (!resolution || !width || !height || !Number.isFinite(x) || !Number.isFinite(y)) {
        return { display: 'none' }
      }
      const pixelX = (x - originX) / resolution
      const pixelY = height - ((y - originY) / resolution)
      const left = Math.min(Math.max((pixelX / width) * 100, 0), 100)
      const top = Math.min(Math.max((pixelY / height) * 100, 0), 100)
      return {
        left: `${left}%`,
        top: `${top}%`,
        opacity: String(point.opacity),
        transform: `translate(-50%, -50%) scale(${point.scale})`
      }
    },
    buildDynamicRadarMap () {
      if (!(this.radarData.mapId || this.radarData.mapVersion || this.radarData.x !== '0.00' || this.radarData.y !== '0.00')) {
        return null
      }
      const points = [
        ...this.radarTrailHistory,
        { x: Number(this.radarData.x), y: Number(this.radarData.y) }
      ].filter(point => Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)))
      const minX = points.length ? Math.min(...points.map(item => Number(item.x))) : Number(this.radarData.x)
      const maxX = points.length ? Math.max(...points.map(item => Number(item.x))) : Number(this.radarData.x)
      const minY = points.length ? Math.min(...points.map(item => Number(item.y))) : Number(this.radarData.y)
      const maxY = points.length ? Math.max(...points.map(item => Number(item.y))) : Number(this.radarData.y)
      const spanX = Math.max(maxX - minX, 20)
      const spanY = Math.max(maxY - minY, 16)
      const paddingX = Math.max(spanX * 0.15, 4)
      const paddingY = Math.max(spanY * 0.15, 4)
      return {
        mapId: this.radarData.mapId || 'mock-slam',
        mapVersion: this.radarData.mapVersion || 'mock-slam-fit',
        resolution: 1,
        originX: minX - paddingX,
        originY: minY - paddingY,
        width: spanX + paddingX * 2,
        height: spanY + paddingY * 2,
        imageUrl: '/mock-slam-map.svg'
      }
    },
    isRadarPositionInsideMap (map) {
      if (!map) return false
      const resolution = Number(map.resolution)
      const width = Number(map.width)
      const height = Number(map.height)
      const originX = Number(map.originX || 0)
      const originY = Number(map.originY || 0)
      const x = Number(this.radarData.x)
      const y = Number(this.radarData.y)
      if (!Number.isFinite(resolution) || resolution <= 0 || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(x) || !Number.isFinite(y)) {
        return false
      }
      const maxX = originX + (width * resolution)
      const maxY = originY + (height * resolution)
      return x >= originX && x <= maxX && y >= originY && y <= maxY
    },
    getGarageCodeFromVehicleCode (vehicleCode) {
      const match = String(vehicleCode || '').trim().toLowerCase().match(/^veh-([a-z0-9]+)-\d{3}$/)
      return match ? match[1] : ''
    },
    startPositionPolling () {
      this.stopPositionPolling()
      if (!this.currentVehicleCode) return
      this.positionPollTimer = setInterval(async () => {
        if (!this.isMonitorRouteActive()) return
        try {
          const res = await getLatestVehiclePosition(this.currentVehicleCode)
          this.applyRadarPosition(res.data)
        } catch (error) {}
      }, 2000)
    },
    stopPositionPolling () {
      if (this.positionPollTimer) {
        clearInterval(this.positionPollTimer)
        this.positionPollTimer = null
      }
    },
    scheduleRealtimeFlush () {
      if (this.realtimeFlushTimer) return
      this.realtimeFlushTimer = setTimeout(() => {
        this.realtimeFlushTimer = null
        this.flushRealtimeUpdates()
      }, 400)
    },
    flushRealtimeUpdates () {
      if (this.pendingRadarPosition) {
        this.applyRadarPosition(this.pendingRadarPosition)
        this.pendingRadarPosition = null
      }
      const pendingSensorPayloads = this.pendingSensorPayloads
      this.pendingSensorPayloads = {}
      Object.keys(pendingSensorPayloads).forEach(sensorType => {
        const messageData = pendingSensorPayloads[sensorType]
        const normalizedType = String((messageData && (messageData.sensorType || messageData.type)) || '').trim().toLowerCase()
        const rawValue = messageData && messageData.valueNum !== undefined ? messageData.valueNum : (messageData ? messageData.value : undefined)
        const numValue = Number(rawValue)
        if (!Number.isFinite(numValue)) return
        if (normalizedType === 'temp_env') {
          this.envData.temp = numValue.toFixed(1)
        } else if (normalizedType === 'smoke' || normalizedType.includes('smoke') || normalizedType.includes('smk')) {
          this.envData.smoke = numValue.toFixed(2)
        }
      })
    },
    setupWebSocket () {
      sensorWs.connect(() => {
        sensorWs.unsubscribe('/topic/vehicle-position/all')
        sensorWs.unsubscribe('/topic/sensor/all')
        sensorWs.subscribe('/topic/vehicle-position/all', (messageData) => {
          if (this.normalizeVehicleCode(messageData && messageData.vehicleCode) === this.normalizeVehicleCode(this.currentVehicleCode)) {
            this.pendingRadarPosition = messageData
            this.scheduleRealtimeFlush()
          }
        })
        sensorWs.subscribe('/topic/sensor/all', (messageData) => {
          if (this.normalizeVehicleCode(messageData && messageData.deviceId) !== this.normalizeVehicleCode(this.currentVehicleCode)) return
          const sensorType = String((messageData && (messageData.sensorType || messageData.type)) || '').trim().toLowerCase()
          if (!sensorType) return
          this.pendingSensorPayloads = {
            ...this.pendingSensorPayloads,
            [sensorType]: messageData
          }
          this.scheduleRealtimeFlush()
        })
      })
    },
    async initVideoStreams () {
      try {
        const res = await getStreamList()
        this.cameras = res.data || []
        const initialCamera = this.pickDefaultCamera(this.cameras)
        if (initialCamera && this.isMonitorRouteActive()) {
          await this.switchCamera(initialCamera, { force: true, silent: true })
        }
      } catch (error) {
        this.$message.error(this.normalizeErrorMessage(error, '获取摄像头列表失败'))
      }
    },
    async switchCamera (cam, options = {}) {
      if (!cam) return
      const force = !!options.force
      const silent = !!options.silent
      if (!this.isMonitorRouteActive()) return
      if (this.switchingCamera && !force) return
      if (!force && this.currentPlayingCameraId === cam.cameraId && !this.isCameraOffline) return
      this.switchingCamera = true
      const requestId = ++this.activePlayRequestId
      this.currentCamera = cam
      this.syncVehicleContextByCamera(cam)

      try {
        const playInfoRes = await getPlayInfo(cam.cameraId)
        if (this.isPlayRequestStale(requestId)) return
        const playInfo = playInfoRes.data || {}
        await this.playCameraStream(cam.cameraId, playInfo, requestId)
        if (this.isPlayRequestStale(requestId)) return
        this.currentPlayingCameraId = cam.cameraId
        this.isCameraOffline = false
      } catch (error) {
        if (this.isPlayRequestStale(requestId)) return
        this.isCameraOffline = true
        this.currentPlayingCameraId = ''
        if (!silent) {
          this.$message.error(this.normalizeErrorMessage(error, `摄像头 [${cam.cameraId}] 播放失败`))
        }
      } finally {
        if (requestId === this.activePlayRequestId) {
          this.switchingCamera = false
        }
      }
    },
    async handleRouteVehicleChange () {
      const requestedVehicleCode = this.getRequestedVehicleCode()
      if (!requestedVehicleCode || !this.cameras.length) return
      const preferredCamera = this.pickPreferredCamera(this.cameras)
      if (preferredCamera) {
        await this.switchCamera(preferredCamera, { force: true, silent: true })
      }
    },
    async playCameraStream (cameraId, playInfo, requestId) {
      if (this.isPlayRequestStale(requestId)) return
      const flvUrl = playInfo.flvUrl ? this.toAbsoluteUrl(playInfo.flvUrl) : ''
      if (window.RTCPeerConnection && playInfo.webrtcRequestUrl) {
        try {
          await this.playWebRtcStream(cameraId, requestId)
          return
        } catch (error) {
          console.warn('WebRTC 播放失败，准备回退 FLV', error)
          if (this.isPlayRequestStale(requestId)) return
        }
      }
      if (flvUrl && this.canPlayFlv()) {
        await this.playFlvStream(flvUrl, requestId)
        return
      }
      throw new Error('未获取到可用的视频播放地址')
    },
    async playWebRtcStream (cameraId, requestId) {
      if (this.isPlayRequestStale(requestId)) return
      this.cleanupMediaPlayer()
      this.isCameraOffline = false
      const video = this.$refs.mainVideoPlayer
      if (!video) return

      const peer = new RTCPeerConnection()
      this.rtcPeer = peer
      const remoteStream = new MediaStream()
      video.srcObject = remoteStream

      peer.addTransceiver('video', { direction: 'recvonly' })
      peer.addTransceiver('audio', { direction: 'recvonly' })
      peer.ontrack = (event) => {
        event.streams.forEach(stream => {
          stream.getTracks().forEach(track => remoteStream.addTrack(track))
        })
      }
      peer.onconnectionstatechange = () => {
        if (this.isPlayRequestStale(requestId)) return
        if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) {
          this.isCameraOffline = true
          this.currentPlayingCameraId = ''
        }
      }

      const offer = await peer.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
      if (this.isPlayRequestStale(requestId)) return
      await peer.setLocalDescription(offer)
      await this.waitForIceGatheringComplete(peer)
      if (this.isPlayRequestStale(requestId)) return
      const res = await playWebRtc(cameraId, peer.localDescription.sdp)
      const answer = res.data || {}
      if (!answer.sdp) throw new Error('未获取到有效的 WebRTC 应答')
      if (this.isPlayRequestStale(requestId)) return
      await peer.setRemoteDescription({ type: answer.type || 'answer', sdp: answer.sdp })
      if (this.isPlayRequestStale(requestId)) return
      await video.play().catch(() => {})
    },
    async playFlvStream (url, requestId) {
      if (this.isPlayRequestStale(requestId)) return
      this.cleanupMediaPlayer()
      this.isCameraOffline = false
      const video = this.$refs.mainVideoPlayer
      if (!video) {
        throw new Error('未找到视频播放器')
      }
      if (!this.canPlayFlv()) {
        throw new Error('当前浏览器不支持 FLV 直播播放')
      }

      await new Promise((resolve, reject) => {
        if (this.isPlayRequestStale(requestId)) {
          resolve()
          return
        }

        const handlePlayerError = this.bindFlvPlayerError(requestId, reject)

        this.flvPlayer = mpegts.createPlayer({
          type: 'flv',
          isLive: true,
          hasAudio: false,
          url
        }, {
          enableWorker: false,
          lazyLoad: false,
          deferLoadAfterSourceOpen: false,
          autoCleanupSourceBuffer: true,
          autoCleanupMaxBackwardDuration: 8,
          autoCleanupMinBackwardDuration: 4,
          fixAudioTimestampGap: false
        })

        this.flvPlayer.on(mpegts.Events.ERROR, handlePlayerError)
        this.flvPlayer.attachMediaElement(video)
        this.flvPlayer.load()

        Promise.resolve(this.flvPlayer.play())
          .then(() => {
            if (this.isPlayRequestStale(requestId)) {
              this.cleanupMediaPlayer()
              resolve()
              return
            }
            resolve()
          })
          .catch(handlePlayerError)
      })
    },
    async handleSnapshot () {
      if (!this.currentCamera || !this.currentCamera.cameraId) {
        return this.$message.warning('当前无可用摄像头')
      }
      try {
        const res = await takeSnapshot(this.currentCamera.cameraId)
        this.currentSnapshotUrl = this.toAbsoluteUrl(res.data.snapshotUrl)
        this.snapshotVisible = true
        this.$message.success('抓拍成功')
      } catch (error) {
        this.$message.error(error || '抓拍失败')
      }
    },
    async initDashboard () {
      try {
        const deviceRes = await getDeviceList()
        const devices = deviceRes.data.list || []
        if (devices.length === 0) return
        const requestedVehicleCode = this.getRequestedVehicleCode()
        const vehicle = devices.find(item => String(item.deviceCode || '').trim().toLowerCase() === requestedVehicleCode) ||
          devices.find(item => /^veh-[a-z0-9]+-\d{3}$/i.test(String(item.deviceCode || '').trim())) ||
          devices[0]
        this.currentVehicleCode = vehicle.deviceCode
        this.startPositionPolling()
        await Promise.all([this.fetchLatestSensors(), this.fetchHistoryCharts()])
        await this.fetchRadarMap()
      } catch (error) {
        console.warn('监控页初始化失败', error)
      }
    },
    async fetchLatestSensors () {
      try {
        const res = await getLatestSensors(this.currentVehicleCode)
        const sensorList = res.data || []
        this.envData.temp = '--'
        this.envData.smoke = '--'
        sensorList.forEach(sensor => {
          const type = (sensor.sensorType || '').toLowerCase()
          if (type === 'temp_env' || type.includes('temp')) this.envData.temp = Number(sensor.valueNum).toFixed(1)
          else if (type === 'smoke' || type.includes('smk')) this.envData.smoke = Number(sensor.valueNum).toFixed(2)
        })
      } catch (error) {
        console.warn('获取最新传感器数据失败', error)
      }
    },
    async fetchHistoryCharts () {
      try {
        const tempRes = await getSensorHistory(this.currentVehicleCode, 'temp', 20)
        const smokeRes = await getSensorHistory(this.currentVehicleCode, 'smoke', 20)
        const tempList = tempRes.data || []
        const smokeList = smokeRes.data || []
        this.historyData.timeAxis = tempList.map(item => {
          const date = new Date(item.ts)
          return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        }).reverse()
        this.historyData.tempSeries = tempList.map(item => item.valueNum).reverse()
        this.historyData.smokeSeries = smokeList.map(item => item.valueNum).reverse()
      } catch (error) {
        console.warn('获取历史趋势失败', error)
      }
    }
  }
}
</script>

<style scoped>
.monitor-view { display: flex; flex-direction: column; gap: 10px; height: 100%; box-sizing: border-box; }
.main-screen { position: relative; flex: 1; border-radius: 25px; overflow: hidden; border: 1px solid #DFE9F4; background-color: #000; min-height: 450px; }
.video-stream { width: 100%; height: 100%; object-fit: cover; display: block; }
.offline-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #051937;
  color: #9fb3c8;
  border: 1px dashed #4a6b8c;
}
.offline-placeholder i { font-size: 48px; margin-bottom: 10px; }
.status-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 6px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.red-pulse { background-color: #ef4444; box-shadow: 0 0 8px #ef4444; animation: pulse 1.5s infinite; }
.dot.white { background-color: #fff; width: 6px; height: 6px; }
.cam-name, .live-text { color: #fff; font-size: 13px; font-weight: bold; }
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.env-hud {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 16px;
}
.hud-item { display: flex; align-items: center; gap: 8px; color: #52c41a; }
.hud-item.warning { color: #faad14; }
.hud-val { font-size: 20px; font-family: monospace; font-weight: bold; color: #fff; }
.hud-val small { font-size: 12px; color: #888; margin-left: 2px; }
.hud-divider { width: 1px; height: 24px; background: rgba(255,255,255,0.2); }
.action-bar { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 12px; }
.icon-btn {
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
}
.radar-thumbnail {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 180px;
  background: rgba(10, 20, 35, 0.9);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 10px;
  overflow: hidden;
}
.radar-scan-box { width: 100%; height: 130px; }
.radar-map-shell { position: relative; width: 100%; height: 100%; }
.radar-map-image { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(1) contrast(1.1) brightness(1.05); }
.radar-trail-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(96, 165, 250, 0.95);
  border: 1px solid rgba(255,255,255,0.88);
  z-index: 1;
  pointer-events: none;
}
.radar-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.radar-marker-dot {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 0 0 4px rgba(239,68,68,0.18);
}
.radar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #dbeafe;
  background: linear-gradient(135deg, #0b203d, #183d68);
}
.radar-info { padding: 6px 10px; background: rgba(0, 0, 0, 0.55); }
.coord-item { font-family: monospace; font-size: 13px; color: #52c41a; display: flex; justify-content: space-between; }
.coord-item span { color: #888; font-size: 11px; font-weight: bold; }
.sub-screens { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; height: 140px; }
.sub-item { position: relative; border-radius: 20px; overflow: hidden; cursor: pointer; border: 1px solid #DFE9F4; }
.sub-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #0b203d, #183d68);
  color: #dbeafe;
}
.sub-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0,0,0,0.8);
  color: #ccc;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}
.sub-item.active { border-color: #ef4444; }
.sub-item.active .sub-label { color: #fff; font-weight: bold; background: #ef4444; }
</style>
