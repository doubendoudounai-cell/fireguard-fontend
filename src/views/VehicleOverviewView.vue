<template>
  <div class="overview-view">
    <div class="overview-header card-shell">
      <div>
        <h2 class="page-title">车辆状态总览</h2>
        <div class="page-subtitle">聚合设备在线、视频、传感器、定位、告警、应急状态，并适配 SLAM 灰度地图点位展示。</div>
      </div>
      <div class="header-actions">
        <div class="refresh-text">最近刷新：{{ formatTime(lastRefreshTime) }}</div>
        <button class="btn-primary" @click="fetchOverview(true)">立即刷新</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card card-shell">
        <div class="stat-label">车辆总数</div>
        <div class="stat-value">{{ vehicles.length }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">在线车辆</div>
        <div class="stat-value text-green">{{ stats.onlineVehicles }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">在线视频路数</div>
        <div class="stat-value text-blue">{{ stats.onlineStreams }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">未关闭告警</div>
        <div class="stat-value text-red">{{ stats.activeAlerts }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">处理中应急</div>
        <div class="stat-value text-orange">{{ stats.activeEmergencies }}</div>
      </div>
    </div>

    <div class="toolbar card-shell">
      <div class="toolbar-left">
        <input
          v-model.trim="keyword"
          class="keyword-input"
          placeholder="搜索车辆编号 / 设备名称 / 摄像头 ID"
        >
        <div class="filter-group">
          <button
            v-for="item in statusFilters"
            :key="item.value"
            class="filter-btn"
            :class="{ active: onlineFilter === item.value }"
            @click="onlineFilter = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="toolbar-right">
        <span class="hint-text">基础数据手动刷新，定位/传感器实时增量更新</span>
      </div>
    </div>

    <div class="map-layout">
      <div class="map-card card-shell" v-loading="mapLoading">
        <div class="map-header">
          <div>
            <div class="panel-title">SLAM 地图联动</div>
            <div class="panel-subtitle">
              车库：{{ currentGarageCode || '--' }}
              <span v-if="displayMap">｜版本：{{ displayMap.mapVersion || '--' }}</span>
            </div>
          </div>
          <div class="map-legend">
            <span><i class="legend-dot trail"></i> 轨迹点</span>
            <span><i class="legend-dot vehicle online"></i> 在线车辆</span>
            <span><i class="legend-dot vehicle offline"></i> 离线车辆</span>
            <span><i class="legend-dot vehicle alert"></i> 异常车辆</span>
            <span><i class="legend-dot risk"></i> 风险点</span>
            <span><i class="legend-dot alarm-event"></i> 告警点</span>
            <span><i class="legend-dot ai-event"></i> AI事件点</span>
          </div>
        </div>

        <div class="map-stage">
          <div v-if="displayMap && displayMap.imageUrl" class="map-shell">
            <img :src="toAbsoluteUrl(displayMap.imageUrl)" class="slam-map-image" alt="SLAM map">

            <button
              v-for="point in mappableVehicleTrails"
              :key="point.key"
              type="button"
              class="map-marker trail-marker"
              :class="trailMarkerClass(point)"
              :style="buildTrailMarkerStyle(point)"
              :title="`${point.deviceCode}｜${formatCoordinate(point)}｜${formatTime(point.ts)}`"
              @click.stop="selectVehicleByCode(point.deviceCode)"
            ></button>

            <button
              v-for="risk in visibleRiskPoints"
              :key="risk.pointCode"
              type="button"
              class="map-marker risk-marker"
              :class="{ selected: selectedRiskPoint && selectedRiskPoint.pointCode === risk.pointCode }"
              :style="buildMapMarkerStyle(risk)"
              :title="`${risk.pointName || risk.pointCode} (${risk.pointType || 'risk'})`"
              @click.stop="selectRiskPoint(risk)"
            >
              !
            </button>
            <button
              v-for="item in mappableAlarmEvents"
              :key="item.key"
              type="button"
              class="map-marker event-marker alarm-marker"
              :class="{ selected: isEventMarkerSelected(item) }"
              :style="buildEventMarkerStyle(item)"
              :title="eventMarkerTitle(item)"
              @click.stop="selectMapEvent(item)"
            >
              {{ eventMarkerText(item) }}
            </button>

            <button
              v-for="item in mappableAiEvents"
              :key="item.key"
              type="button"
              class="map-marker event-marker ai-marker"
              :class="{ selected: isEventMarkerSelected(item) }"
              :style="buildEventMarkerStyle(item)"
              :title="eventMarkerTitle(item)"
              @click.stop="selectMapEvent(item)"
            >
              {{ eventMarkerText(item) }}
            </button>

            <button
              v-for="item in mappableVehicles"
              :key="item.id"
              type="button"
              class="map-marker vehicle-marker"
              :class="vehicleMarkerClass(item)"
              :style="buildMapMarkerStyle(item.mapPosition)"
              :title="`${item.deviceCode} | ${item.online ? '在线' : '离线'} | 告警:${item.activeAlerts} | 应急:${item.activeEmergencies}`"
              @click.stop="openVehicleMonitorByCode(item.deviceCode)"
            >
              <i class="el-icon-truck vehicle-marker-icon"></i>
              <span class="vehicle-marker-label">{{ shortVehicleLabel(item.deviceCode) }}</span>
            </button>
          </div>
          <div v-else class="map-empty">
            当前未配置可访问的 SLAM 灰度地图底图
          </div>
        </div>

        <div v-if="displayMap" class="map-meta">
          <div class="meta-item">分辨率：{{ displayMap.resolution || '--' }} m/px</div>
          <div class="meta-item">原点：({{ displayMap.originX || '--' }}, {{ displayMap.originY || '--' }})</div>
          <div class="meta-item">尺寸：{{ displayMap.width || '--' }} × {{ displayMap.height || '--' }}</div>
          <div class="meta-item">轨迹点：{{ mappableVehicleTrails.length }}</div>
          <div class="meta-item">风险点：{{ visibleRiskPoints.length }}</div>
          <div class="meta-item">告警点：{{ mappableAlarmEvents.length }}</div>
          <div class="meta-item">AI事件点：{{ mappableAiEvents.length }}</div>
          <div v-if="usingMockMap" class="meta-item">当前使用 Mock 地图</div>
        </div>
      </div>

      <div class="focus-card card-shell">
        <div class="panel-title">地图焦点信息</div>

        <div class="focus-section">
          <div class="focus-section-title">车辆焦点</div>
          <template v-if="selectedVehicle">
            <div class="focus-name-row">
              <strong>{{ selectedVehicle.deviceCode }}</strong>
              <span class="status-pill" :class="selectedVehicle.online ? 'online' : 'offline'">
                {{ selectedVehicle.online ? '在线' : '离线' }}
              </span>
            </div>
            <div class="focus-desc">{{ selectedVehicle.deviceName || '未命名车辆设备' }}</div>
            <div class="focus-grid">
              <div class="focus-item">
                <label>当前位置</label>
                <span>{{ formatCoordinate(selectedVehiclePosition) }}</span>
              </div>
              <div class="focus-item">
                <label>地图版本</label>
                <span>{{ selectedVehiclePosition ? (selectedVehiclePosition.mapVersion || '--') : '--' }}</span>
              </div>
              <div class="focus-item">
                <label>定位质量</label>
                <span>{{ formatQuality(selectedVehiclePosition && selectedVehiclePosition.quality) }}</span>
              </div>
              <div class="focus-item">
                <label>定位状态</label>
                <span>{{ (selectedVehiclePosition && selectedVehiclePosition.locStatus) || '--' }}</span>
              </div>
              <div class="focus-item">
                <label>移动速度</label>
                <span>{{ formatSpeed(selectedVehiclePosition) }}</span>
              </div>
              <div class="focus-item">
                <label>朝向角</label>
                <span>{{ formatYaw(selectedVehiclePosition && selectedVehiclePosition.yaw) }}</span>
              </div>
              <div class="focus-item">
                <label>视频状态</label>
                <span>{{ selectedVehicle.onlineCameraCount }}/{{ selectedVehicle.cameraCount }}</span>
              </div>
              <div class="focus-item">
                <label>未关闭告警</label>
                <span class="text-red">{{ selectedVehicle.activeAlerts }}</span>
              </div>
              <div class="focus-item">
                <label>处理中应急</label>
                <span class="text-orange">{{ selectedVehicle.activeEmergencies }}</span>
              </div>
              <div class="focus-item">
                <label>温度 / 烟雾</label>
                <span>{{ formatSensorValue(selectedVehicle.temp, '℃') }} / {{ formatSensorValue(selectedVehicle.smoke, 'ppm') }}</span>
              </div>
              <div class="focus-item">
                <label>轨迹摘要</label>
                <span>{{ vehicleTrailSummaryText }}</span>
              </div>
            </div>
            <div class="focus-actions">
              <button class="btn-secondary" @click="goRoute('/monitor')">查看监控</button>
              <button class="btn-secondary" @click="goRoute('/alarm')">查看告警</button>
              <button class="btn-secondary" @click="goRoute('/task')">查看应急</button>
            </div>
          </template>
          <div v-else class="focus-empty">暂无可定位车辆</div>
        </div>

        <div class="risk-focus-section">
          <div class="focus-section-title">风险点焦点</div>
          <template v-if="selectedRiskPoint">
            <div class="focus-name-row">
              <strong>{{ selectedRiskPoint.pointName || selectedRiskPoint.pointCode }}</strong>
              <span class="status-pill neutral">{{ getRiskTypeName(selectedRiskPoint.pointType) }}</span>
            </div>
            <div class="focus-desc">点位编码：{{ selectedRiskPoint.pointCode || '--' }}</div>
            <div class="focus-grid compact">
              <div class="focus-item">
                <label>坐标</label>
                <span>{{ formatCoordinate(selectedRiskPoint) }}</span>
              </div>
              <div class="focus-item">
                <label>风险类型</label>
                <span>{{ getRiskTypeName(selectedRiskPoint.pointType) }}</span>
              </div>
              <div class="focus-item">
                <label>地图 ID</label>
                <span>{{ selectedRiskPoint.mapId || (displayMap && displayMap.mapId) || '--' }}</span>
              </div>
              <div class="focus-item">
                <label>地图版本</label>
                <span>{{ selectedRiskPoint.mapVersion || (displayMap && displayMap.mapVersion) || '--' }}</span>
              </div>
            </div>
            <div class="focus-actions">
              <button class="btn-secondary" @click="goRoute('/archive')">前往车库档案</button>
            </div>
          </template>
          <div v-else class="focus-empty">点击地图上的风险点可快捷浏览信息</div>
        </div>

        <div class="risk-focus-section">
          <div class="focus-section-title">传感器焦点</div>
          <template v-if="selectedSensorDevice">
            <div class="focus-name-row">
              <strong>{{ selectedSensorDevice.deviceCode }}</strong>
              <span class="status-pill" :class="selectedSensorDevice.online ? 'online' : 'offline'">
                {{ selectedSensorDevice.online ? '在线' : '离线' }}
              </span>
            </div>
            <div class="focus-desc">{{ selectedSensorDevice.deviceName || '未命名传感器设备' }}</div>
            <div class="focus-grid compact">
              <div class="focus-item">
                <label>温度</label>
                <span>{{ formatSensorValue(selectedSensorDevice.temp, '℃') }}</span>
              </div>
              <div class="focus-item">
                <label>烟雾</label>
                <span>{{ formatSensorValue(selectedSensorDevice.smoke, 'ppm') }}</span>
              </div>
              <div class="focus-item">
                <label>设备类型</label>
                <span>{{ selectedSensorDevice.deviceType || '--' }}</span>
              </div>
              <div class="focus-item">
                <label>最新上报</label>
                <span>{{ formatTime(selectedSensorDevice.sensorTs || selectedSensorDevice.lastOnlineTime) }}</span>
              </div>
            </div>
            <div v-if="selectedSensorDevice.extraSensors && selectedSensorDevice.extraSensors.length" class="focus-tag-list">
              <span
                v-for="sensor in selectedSensorDevice.extraSensors"
                :key="`${selectedSensorDevice.deviceCode}-${sensor.sensorType}`"
                class="mini-tag tag-online"
              >
                {{ sensor.sensorType }}: {{ sensor.displayValue }}
              </span>
            </div>
          </template>
          <div v-else class="focus-empty">点击下方在线传感器设备卡片查看实时值</div>
        </div>

        <div ref="eventFocusSection" class="event-focus-section">
          <div class="focus-section-title">事件焦点</div>
          <template v-if="selectedMapEvent">
            <div class="event-focus-head">
              <div class="event-focus-type" :class="selectedMapEvent.sourceType === 'ALARM' ? 'alarm' : 'ai'">
                {{ selectedMapEvent.sourceType === 'ALARM' ? '告警事件' : 'AI事件' }}
              </div>
              <strong>{{ selectedMapEvent.title }}</strong>
            </div>
            <div class="focus-desc">{{ selectedMapEvent.subtitle }}</div>
            <div class="focus-grid compact">
              <div class="focus-item">
                <label>坐标</label>
                <span>{{ formatCoordinate(selectedMapEvent.position) }}</span>
              </div>
              <div class="focus-item">
                <label>地图版本</label>
                <span>{{ selectedMapEvent.position ? (selectedMapEvent.position.mapVersion || '--') : '--' }}</span>
              </div>
              <div class="focus-item">
                <label>发生时间</label>
                <span>{{ formatTime(selectedMapEvent.occurTime) }}</span>
              </div>
              <div class="focus-item">
                <label>定位质量</label>
                <span>{{ formatQuality(selectedMapEvent.position && selectedMapEvent.position.quality) }}</span>
              </div>
              <div class="focus-item">
                <label>来源对象</label>
                <span>{{ selectedMapEvent.deviceLabel }}</span>
              </div>
              <div class="focus-item">
                <label>状态</label>
                <span>{{ selectedMapEvent.statusText }}</span>
              </div>
            </div>
            <div class="focus-actions">
              <button class="btn-secondary" @click="goToMapEvent(selectedMapEvent)">
                {{ selectedMapEvent.sourceType === 'ALARM' ? '前往告警中心' : '前往历史记录' }}
              </button>
              <button
                v-if="selectedMapEventGroup && selectedMapEventGroup.count > 1"
                class="btn-secondary"
                @click="goToGroupedMapEvents(selectedMapEventGroup)"
              >
                {{ selectedMapEvent.sourceType === 'ALARM' ? `查看这${selectedMapEventGroup.count}条告警` : `查看这${selectedMapEventGroup.count}条AI事件` }}
              </button>
              <button
                v-if="selectedMapEvent.sourceType === 'AI' && selectedMapEvent.alertId"
                class="btn-secondary"
                @click="$router.push({ path: '/alarm', query: { alertId: String(selectedMapEvent.alertId) } }).catch(() => {})"
              >
                查看关联告警
              </button>
            </div>
          </template>
          <div v-else class="focus-empty">点击地图上的告警点或 AI 事件点查看详情</div>
        </div>
      </div>
    </div>

    <VehicleOverviewStaticPanels
      :filtered-vehicles="filteredVehicles"
      :loading="loading"
      :online-sensor-devices="onlineSensorDevices"
      :selected-vehicle-id="selectedVehicle && selectedVehicle.id"
      :selected-sensor-device-id="selectedSensorDevice && selectedSensorDevice.id"
      :vehicle-positions-map="vehiclePositionsMap"
      @select-vehicle="selectVehicle"
      @select-sensor-device="selectSensorDevice"
      @route="goRoute"
    />

  </div>
</template>

<script>
import { getDeviceList, getLatestSensors, getLatestVehiclePosition, getVehiclePositionHistory, getGarageMap } from '@/api/device'
import { getRiskPoints } from '@/api/map'
import { getStreamList } from '@/api/video'
import { getAlarmList } from '@/api/alarm'
import { getAiEventList } from '@/api/ai'
import { getEmergencyList } from '@/api/emergency'
import { API_BASE_URL } from '@/utils/request'
import { sensorWs } from '@/utils/websocket'
import VehicleOverviewStaticPanels from '@/components/overview/VehicleOverviewStaticPanels.vue'

export default {
  name: 'VehicleOverviewView',
  components: {
    VehicleOverviewStaticPanels
  },
  data () {
    return {
      loading: false,
      mapLoading: false,
      vehicles: [],
      sensorDevices: [],
      vehiclePositionsMap: {},
      alarmEvents: [],
      aiEvents: [],
      currentMap: null,
      riskPoints: [],
      vehicleTrails: {},
      currentGarageCode: '',
      selectedVehicle: null,
      selectedSensorDevice: null,
      selectedRiskPoint: null,
      selectedMapEvent: null,
      keyword: '',
      onlineFilter: 'all',
      lastRefreshTime: null,
      refreshTimer: null,
      positionRefreshTimer: null,
      positionRefreshPending: false,
      fetchOverviewPending: false,
      currentTrailVehicleCode: '',
      pendingRealtimePositions: {},
      pendingRealtimeSensors: {},
      realtimeFlushTimer: null,
      statusFilters: [
        { label: '全部', value: 'all' },
        { label: '仅在线', value: 'online' },
        { label: '仅离线', value: 'offline' }
      ]
    }
  },
  computed: {
    filteredVehicles () {
      let list = this.vehicles.slice()
      if (this.onlineFilter === 'online') {
        list = list.filter(item => item.online)
      } else if (this.onlineFilter === 'offline') {
        list = list.filter(item => !item.online)
      }
      if (this.keyword) {
        const kw = this.keyword.toLowerCase()
        list = list.filter(item =>
          String(item.deviceCode || '').toLowerCase().includes(kw) ||
          String(item.deviceName || '').toLowerCase().includes(kw) ||
          item.cameras.some(cam => String(cam.cameraId || '').toLowerCase().includes(kw))
        )
      }
      return list.sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1
        if (a.activeAlerts !== b.activeAlerts) return b.activeAlerts - a.activeAlerts
        return String(a.deviceCode || '').localeCompare(String(b.deviceCode || ''))
      })
    },
    stats () {
      return {
        onlineVehicles: this.vehicles.filter(item => item.online).length,
        onlineStreams: this.vehicles.reduce((sum, item) => sum + item.onlineCameraCount, 0),
        activeAlerts: this.vehicles.reduce((sum, item) => sum + item.activeAlerts, 0),
        activeEmergencies: this.vehicles.reduce((sum, item) => sum + item.activeEmergencies, 0)
      }
    },
    onlineSensorDevices () {
      return this.sensorDevices
        .filter(item => item.online)
        .sort((a, b) => String(a.deviceCode || '').localeCompare(String(b.deviceCode || '')))
    },
    selectedVehiclePosition () {
      return this.getVehicleDisplayPosition(this.selectedVehicle)
    },
    mappableVehicles () {
      return this.filteredVehicles
        .map(item => {
          const mapPosition = this.getVehicleDisplayPosition(item)
          return {
            id: item.id,
            deviceCode: item.deviceCode,
            online: item.online,
            activeAlerts: item.activeAlerts,
            activeEmergencies: item.activeEmergencies,
            mapPosition
          }
        })
        .filter(item => this.isPositionMappable(item.mapPosition))
    },
    mappableVehicleTrails () {
      const focusVehicle = (this.selectedVehicle && this.vehicles.find(item => item.id === this.selectedVehicle.id)) ||
        this.filteredVehicles.find(item => item.activeAlerts > 0 || item.activeEmergencies > 0) ||
        this.filteredVehicles.find(item => item.online) ||
        this.filteredVehicles[0]
      if (!focusVehicle) return []
      const points = this.buildVehicleTrailPoints(focusVehicle).slice(-18)
      const total = points.length || 1
      return points.map((point, index) => ({
        ...point,
        trailOpacity: Math.min(0.92, 0.28 + ((index + 1) / total) * 0.64),
        trailScale: 0.72 + ((index + 1) / total) * 0.5,
        trailZIndex: 1 + index
      }))
    },
    mappableAlarmEvents () {
      return this.aggregateMapEvents(this.alarmEvents.filter(item => {
        if (!this.isEventPositionMappable(item.position)) return false
        const status = String(item.status || '').toUpperCase()
        return !['RESOLVED', 'CLOSED'].includes(status)
      }), 'ALARM')
    },
    mappableAiEvents () {
      return this.aggregateMapEvents(this.aiEvents.filter(item => this.isEventPositionMappable(item.position)), 'AI')
    },
    allMapEvents () {
      return [...this.alarmEvents, ...this.aiEvents].sort((a, b) => {
        const timeA = new Date(a.occurTime || 0).getTime() || 0
        const timeB = new Date(b.occurTime || 0).getTime() || 0
        return timeB - timeA
      })
    },
    visibleRiskPoints () {
      if (!this.displayMap) return []
      return this.riskPoints.filter(item => this.isRiskPointVisible(item))
    },
    displayMap () {
      if (this.currentMap && this.currentMap.imageUrl) {
        return this.currentMap
      }
      return this.mockMap
    },
    usingMockMap () {
      return !!(this.displayMap && this.displayMap.mock)
    },
    mockMap () {
      const points = []
      this.vehicles.forEach(item => {
        const position = this.getVehicleDisplayPosition(item)
        if (position && position.x !== undefined && position.y !== undefined) {
          points.push({ x: Number(position.x), y: Number(position.y) })
        }
      })
      this.riskPoints.forEach(item => {
        if (item.x !== undefined && item.y !== undefined) {
          points.push({ x: Number(item.x), y: Number(item.y) })
        }
      })
      this.alarmEvents.forEach(item => {
        if (item.position && item.position.x !== undefined && item.position.y !== undefined) {
          points.push({ x: Number(item.position.x), y: Number(item.position.y) })
        }
      })
      this.aiEvents.forEach(item => {
        if (item.position && item.position.x !== undefined && item.position.y !== undefined) {
          points.push({ x: Number(item.position.x), y: Number(item.position.y) })
        }
      })
      Object.values(this.vehicleTrails).forEach(list => {
        ;(list || []).forEach(point => {
          if (point && point.x !== undefined && point.y !== undefined) {
            points.push({ x: Number(point.x), y: Number(point.y) })
          }
        })
      })

      const valid = points.filter(item => Number.isFinite(item.x) && Number.isFinite(item.y))
      const minX = valid.length ? Math.min(...valid.map(item => item.x)) : 0
      const maxX = valid.length ? Math.max(...valid.map(item => item.x)) : 40
      const minY = valid.length ? Math.min(...valid.map(item => item.y)) : 0
      const maxY = valid.length ? Math.max(...valid.map(item => item.y)) : 30
      const spanX = Math.max(maxX - minX, 20)
      const spanY = Math.max(maxY - minY, 15)
      const paddingX = Math.max(spanX * 0.12, 4)
      const paddingY = Math.max(spanY * 0.12, 4)

      return {
        garageCode: this.currentGarageCode || 'mock',
        mapId: 'mock-slam',
        mapVersion: 'mock-slam-fit',
        resolution: 1,
        originX: minX - paddingX,
        originY: minY - paddingY,
        width: spanX + paddingX * 2,
        height: spanY + paddingY * 2,
        imageUrl: '/mock-slam-map.svg',
        mock: true
      }
    },
    selectedVehicleTrailSummary () {
      if (!this.selectedVehicle || !this.selectedVehicle.deviceCode) return null
      const points = this.buildVehicleTrailPoints(this.selectedVehicle)
      if (!points.length) return null
      let distanceMeters = 0
      for (let i = 1; i < points.length; i += 1) {
        distanceMeters += this.calcDistance(points[i - 1], points[i])
      }
      const firstTs = points[0] && points[0].ts
      const lastTs = points[points.length - 1] && points[points.length - 1].ts
      const durationMs = this.calcTimeGapMs(firstTs, lastTs)
      return {
        count: points.length,
        distanceMeters,
        durationMs,
        lastTs
      }
    },
    vehicleTrailSummaryText () {
      const summary = this.selectedVehicleTrailSummary
      if (!summary) return '--'
      const distanceText = `${summary.distanceMeters.toFixed(summary.distanceMeters >= 100 ? 0 : 1)}m`
      const durationText = summary.durationMs !== null ? `${Math.max(1, Math.round(summary.durationMs / 1000))}s` : '--'
      return `${summary.count}点 / ${distanceText} / ${durationText}`
    },
    selectedMapEventGroup () {
      if (!this.selectedMapEvent) return null
      const sourceType = String(this.selectedMapEvent.sourceType || '').toUpperCase()
      const list = sourceType === 'AI' ? this.mappableAiEvents : this.mappableAlarmEvents
      return list.find(item => {
        if (Array.isArray(item.eventKeys)) {
          return item.eventKeys.includes(this.selectedMapEvent.key)
        }
        return item.key === this.selectedMapEvent.key
      }) || null
    }
  },
  watch: {
    filteredVehicles () {
      this.syncSelectedVehicle()
    },
    sensorDevices () {
      this.syncSelectedSensorDevice()
    },
    riskPoints () {
      this.syncSelectedRiskPoint()
    },
    selectedVehicle (value, oldValue) {
      const nextCode = value && value.deviceCode
      const prevCode = oldValue && oldValue.deviceCode
      if (nextCode === prevCode) return
      this.fetchVehicleTrailsForVehicle(nextCode)
    }
  },
  created () {
    this.fetchOverview()
    this.setupOverviewRealtimeWs()
  },
  beforeDestroy () {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.positionRefreshTimer) {
      clearInterval(this.positionRefreshTimer)
      this.positionRefreshTimer = null
    }
    if (this.realtimeFlushTimer) {
      clearTimeout(this.realtimeFlushTimer)
      this.realtimeFlushTimer = null
    }
    sensorWs.unsubscribe('/topic/vehicle-position/all')
    sensorWs.unsubscribe('/topic/sensor/all')
  },
  methods: {
    setupOverviewRealtimeWs () {
      sensorWs.connect(() => {
        sensorWs.unsubscribe('/topic/vehicle-position/all')
        sensorWs.unsubscribe('/topic/sensor/all')
        sensorWs.subscribe('/topic/vehicle-position/all', (messageData) => {
          this.handleRealtimeVehiclePosition(messageData)
        })
        sensorWs.subscribe('/topic/sensor/all', (messageData) => {
          this.handleRealtimeSensorMessage(messageData)
        })
      })
    },
    handleRealtimeVehiclePosition (messageData) {
      const vehicleCode = messageData && messageData.vehicleCode
      if (!vehicleCode) return
      if (!this.vehicles.some(item => item.deviceCode === vehicleCode)) return
      this.pendingRealtimePositions = {
        ...this.pendingRealtimePositions,
        [vehicleCode]: messageData
      }
      this.scheduleRealtimeFlush()
    },
    handleRealtimeSensorMessage (messageData) {
      const deviceCode = this.resolveRealtimeSensorDeviceCode(messageData)
      if (!deviceCode) return
      if (!this.vehicles.some(item => item.deviceCode === deviceCode) &&
        !this.sensorDevices.some(item => item.deviceCode === deviceCode)) {
        return
      }
      this.pendingRealtimeSensors = {
        ...this.pendingRealtimeSensors,
        [deviceCode]: messageData
      }
      this.scheduleRealtimeFlush()
    },
    scheduleRealtimeFlush () {
      if (this.realtimeFlushTimer) return
      this.realtimeFlushTimer = setTimeout(() => {
        this.realtimeFlushTimer = null
        this.flushRealtimeOverviewData()
      }, 250)
    },
    flushRealtimeOverviewData () {
      let updated = false
      const pendingPositions = this.pendingRealtimePositions
      this.pendingRealtimePositions = {}
      Object.keys(pendingPositions).forEach(vehicleCode => {
        const payload = pendingPositions[vehicleCode]
        const position = this.normalizeRealtimePosition(payload)
        if (!position) return
        if (!this.hasPositionChanged(this.vehiclePositionsMap[vehicleCode], position)) return
        this.$set(this.vehiclePositionsMap, vehicleCode, position)
        if (vehicleCode === this.currentTrailVehicleCode) {
          this.appendTrailPoint(vehicleCode, position)
        }
        updated = true
      })

      const pendingSensors = this.pendingRealtimeSensors
      this.pendingRealtimeSensors = {}
      Object.keys(pendingSensors).forEach(deviceCode => {
        const updatedBySensor = this.applyRealtimeSensorToCollections(deviceCode, pendingSensors[deviceCode])
        updated = updated || updatedBySensor
      })

      if (updated) {
        this.lastRefreshTime = new Date().toISOString()
      }
    },
    async fetchOverview (manual = false) {
      if (this.fetchOverviewPending) {
        if (manual) {
          this.$message.warning('正在刷新中，请稍后')
        }
        return
      }
      this.fetchOverviewPending = true
      this.loading = true
      try {
        const selectedEventKey = this.selectedMapEvent && this.selectedMapEvent.key
        const [deviceRes, streamRes, alarmRes, aiRes, emergencyRes] = await Promise.allSettled([
          getDeviceList(1, 100),
          getStreamList(),
          getAlarmList(1, 200),
          getAiEventList({ page: 1, size: 200 }),
          getEmergencyList({ page: 1, size: 200 })
        ])

        const devices = deviceRes.status === 'fulfilled' ? (((deviceRes.value || {}).data || {}).list || []) : []
        const streams = streamRes.status === 'fulfilled' ? (streamRes.value.data || []) : []
        const alarms = alarmRes.status === 'fulfilled' ? ((((alarmRes.value || {}).data || {}).list) || []) : []
        const aiEvents = aiRes.status === 'fulfilled' ? ((((aiRes.value || {}).data || {}).list) || []) : []
        const emergencies = emergencyRes.status === 'fulfilled' ? ((((emergencyRes.value || {}).data || {}).list) || []) : []

        const vehicles = devices.filter(item => this.isVehicleCode(item.deviceCode))
        const sensorDevices = devices.filter(item => !this.isVehicleCode(item.deviceCode))
        const cards = await Promise.all(vehicles.map(item => this.buildVehicleCard(item, streams, alarms, emergencies)))
        const sensorCards = await Promise.all(sensorDevices.map(item => this.buildSensorDeviceCard(item)))
        this.vehicles = cards
        this.syncVehiclePositionsMap(cards)
        this.sensorDevices = sensorCards
        this.alarmEvents = alarms
          .map(item => this.normalizeAlarmMapEvent(item))
          .filter(Boolean)
        this.aiEvents = aiEvents
          .map(item => this.normalizeAiMapEvent(item))
          .filter(Boolean)

        const nextGarageCode = this.resolveGarageCode(cards)
        const garageChanged = nextGarageCode && nextGarageCode !== this.currentGarageCode
        if (garageChanged) {
          this.currentGarageCode = nextGarageCode
        }
        if (nextGarageCode && (garageChanged || manual || !this.currentMap)) {
          await this.fetchMapData(nextGarageCode)
        }

        this.syncSelectedVehicle()
        this.syncSelectedRiskPoint()
        this.syncSelectedMapEvent(selectedEventKey)
        this.lastRefreshTime = new Date().toISOString()
        if (manual) {
          this.$message.success('车辆状态已刷新')
        }
      } catch (error) {
        this.$message.error(error || '加载车辆状态总览失败')
      } finally {
        this.loading = false
        this.fetchOverviewPending = false
      }
    },
    getPositionPollingTargets () {
      const target = (this.selectedVehicle && this.vehicles.find(item => item.id === this.selectedVehicle.id && item.online)) ||
        this.vehicles.find(item => (item.activeAlerts > 0 || item.activeEmergencies > 0) && item.online) ||
        this.vehicles.find(item => item.online)
      return target ? [target] : []
    },
    syncVehiclePositionsMap (vehicles) {
      const nextMap = { ...this.vehiclePositionsMap }
      ;(vehicles || []).forEach(item => {
        const position = this.normalizeRealtimePosition(item && item.position)
        if (position && item && item.deviceCode) {
          nextMap[item.deviceCode] = position
        }
      })
      this.vehiclePositionsMap = nextMap
    },
    async fetchMapData (garageCode) {
      if (!garageCode) {
        this.currentMap = null
        this.riskPoints = []
        return
      }
      this.mapLoading = true
      try {
        const mapRes = await getGarageMap(garageCode)
        this.currentMap = mapRes.data || null
        if (this.currentMap && this.currentMap.mapId && this.currentMap.mapVersion) {
          const riskRes = await getRiskPoints(garageCode, {
            mapId: this.currentMap.mapId,
            mapVersion: this.currentMap.mapVersion
          })
          this.riskPoints = riskRes.data || []
        } else {
          this.riskPoints = []
        }
      } catch (e) {
        this.currentMap = null
        this.riskPoints = []
      } finally {
        this.mapLoading = false
      }
    },
    async buildVehicleCard (device, streams, alarms, emergencies) {
      const cameras = streams.filter(item => this.extractVehicleCode(item.cameraId) === device.deviceCode)
      const deviceAlerts = alarms.filter(item => Number(item.deviceId) === Number(device.id))
      const activeAlerts = deviceAlerts.filter(item => !['CLOSED', 'RESOLVED'].includes(String(item.status || '').toUpperCase()))
      const deviceEmergencies = emergencies.filter(item => Number(item.triggerDeviceId) === Number(device.id))
      const activeEmergencies = deviceEmergencies.filter(item => String(item.status || '').toUpperCase() !== 'CLOSED')

      const [sensorRes, positionRes] = await Promise.allSettled([
        getLatestSensors(device.deviceCode),
        getLatestVehiclePosition(device.deviceCode)
      ])

      const sensors = sensorRes.status === 'fulfilled' ? (sensorRes.value.data || []) : []
      const position = positionRes.status === 'fulfilled' ? (positionRes.value.data || null) : null
      const tempItem = sensors.find(item => String(item.sensorType || '').toLowerCase().includes('temp'))
      const smokeItem = sensors.find(item => {
        const raw = String(item.sensorType || '').toLowerCase()
        return raw.includes('smoke') || raw.includes('smk')
      })
      const primaryCamera = cameras.find(item => item.online) || cameras[0] || null

      return {
        ...device,
        online: String(device.onlineStatus || '').toLowerCase() === 'online',
        cameras,
        cameraCount: cameras.length,
        onlineCameraCount: cameras.filter(item => item.online).length,
        primaryCameraId: primaryCamera ? primaryCamera.cameraId : null,
        temp: tempItem && (tempItem.valueNum !== undefined && tempItem.valueNum !== null ? tempItem.valueNum : tempItem.valueText),
        smoke: smokeItem && (smokeItem.valueNum !== undefined && smokeItem.valueNum !== null ? smokeItem.valueNum : smokeItem.valueText),
        sensorTs: (tempItem && (tempItem.ts || tempItem.updatedAt)) || (smokeItem && (smokeItem.ts || smokeItem.updatedAt)) || null,
        position,
        activeAlerts: activeAlerts.length,
        lastAlertTime: deviceAlerts[0] ? (deviceAlerts[0].occurTime || deviceAlerts[0].createdAt) : null,
        activeEmergencies: activeEmergencies.length,
        lastEmergencyTime: deviceEmergencies[0] ? (deviceEmergencies[0].triggerTime || deviceEmergencies[0].createdAt) : null
      }
    },
    async buildSensorDeviceCard (device) {
      const sensorRes = await Promise.allSettled([
        getLatestSensors(device.deviceCode)
      ])
      const sensors = sensorRes[0].status === 'fulfilled' ? (sensorRes[0].value.data || []) : []
      return this.normalizeSensorDevice(device, sensors)
    },
    normalizeSensorDevice (device, sensors = []) {
      const tempItem = sensors.find(item => String(item.sensorType || '').toLowerCase().includes('temp'))
      const smokeItem = sensors.find(item => {
        const raw = String(item.sensorType || '').toLowerCase()
        return raw.includes('smoke') || raw.includes('smk')
      })
      const extraSensors = sensors
        .filter(item => item !== tempItem && item !== smokeItem)
        .map(item => ({
          sensorType: item.sensorType || '--',
          displayValue: this.displaySensorRawValue(item)
        }))
      return {
        ...device,
        online: String(device.onlineStatus || '').toLowerCase() === 'online',
        temp: tempItem && this.extractSensorValue(tempItem),
        smoke: smokeItem && this.extractSensorValue(smokeItem),
        sensorTs: (tempItem && (tempItem.ts || tempItem.updatedAt)) ||
          (smokeItem && (smokeItem.ts || smokeItem.updatedAt)) ||
          (sensors[0] && (sensors[0].ts || sensors[0].updatedAt)) ||
          null,
        extraSensors
      }
    },
    extractSensorValue (item) {
      return item && item.valueNum !== undefined && item.valueNum !== null ? item.valueNum : (item && item.valueText)
    },
    displaySensorRawValue (item) {
      const value = this.extractSensorValue(item)
      if (value === null || value === undefined || value === '') return '--'
      const num = Number(value)
      return Number.isFinite(num) ? num.toFixed(2) : String(value)
    },
    async fetchVehicleTrailsForVehicle (vehicleCode, force = false) {
      if (!vehicleCode) {
        this.vehicleTrails = {}
        this.currentTrailVehicleCode = ''
        return
      }
      if (!force && this.currentTrailVehicleCode === vehicleCode && this.vehicleTrails[vehicleCode]) {
        return
      }
      this.currentTrailVehicleCode = vehicleCode
      const to = Date.now()
      const from = to - 15 * 60 * 1000
      try {
        const res = await getVehiclePositionHistory(vehicleCode, { from, to, limit: 60 })
        if (this.currentTrailVehicleCode !== vehicleCode) return
        const points = ((res.data || []).map(point => this.normalizeTrailPoint(point)).filter(Boolean))
        this.vehicleTrails = points.length ? { [vehicleCode]: points } : (this.vehicleTrails[vehicleCode] ? { [vehicleCode]: this.vehicleTrails[vehicleCode] } : {})
      } catch (e) {
        if (this.currentTrailVehicleCode === vehicleCode && !this.vehicleTrails[vehicleCode]) {
          this.vehicleTrails = {}
        }
      }
    },
    normalizeTrailPoint (point) {
      if (!point) return null
      const x = Number(point.x)
      const y = Number(point.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      return {
        ...point,
        x,
        y
      }
    },
    normalizeRealtimePosition (point) {
      const normalized = this.normalizeTrailPoint(point)
      if (!normalized) return null
      return {
        ...normalized,
        quality: point.quality,
        yaw: point.yaw,
        vx: point.vx,
        vy: point.vy,
        wz: point.wz,
        z: point.z,
        source: point.source,
        frameId: point.frameId,
        locStatus: point.locStatus,
        mapId: point.mapId,
        mapVersion: point.mapVersion,
        ts: point.ts
      }
    },
    resolveGarageCode (vehicles) {
      const first = (vehicles || []).find(item => this.getGarageCodeFromVehicleCode(item.deviceCode))
      return first ? this.getGarageCodeFromVehicleCode(first.deviceCode) : ''
    },
    getGarageCodeFromVehicleCode (vehicleCode) {
      const match = String(vehicleCode || '').trim().toLowerCase().match(/^veh-([a-z0-9]+)-\d{3}$/)
      return match ? match[1] : ''
    },
    isVehicleCode (value) {
      return /^veh-[a-z0-9]+-\d{3}$/i.test(String(value || '').trim())
    },
    extractVehicleCode (cameraId) {
      const match = String(cameraId || '').trim().toLowerCase().match(/^cam-(veh-[a-z0-9]+-\d{3})-[a-z0-9]+$/)
      return match ? match[1] : null
    },
    syncSelectedVehicle () {
      const currentId = this.selectedVehicle && this.selectedVehicle.id
      const next = this.filteredVehicles.find(item => item.id === currentId) ||
        this.filteredVehicles.find(item => item.activeAlerts > 0 || item.activeEmergencies > 0) ||
        this.filteredVehicles.find(item => item.online) ||
        this.filteredVehicles[0] ||
        null
      this.selectedVehicle = next
    },
    selectVehicle (item) {
      this.selectedVehicle = item
      if (item && item.deviceCode) {
        this.fetchVehicleTrailsForVehicle(item.deviceCode)
      }
    },
    selectSensorDevice (item) {
      this.selectedSensorDevice = item
    },
    getVehicleDisplayPosition (vehicle) {
      if (!vehicle || !vehicle.deviceCode) return null
      return this.vehiclePositionsMap[vehicle.deviceCode] || vehicle.position || null
    },
    selectVehicleByCode (vehicleCode) {
      const target = this.filteredVehicles.find(item => item.deviceCode === vehicleCode) ||
        this.vehicles.find(item => item.deviceCode === vehicleCode)
      if (target) {
        this.selectVehicle(target)
      }
    },
    syncSelectedRiskPoint () {
      const currentCode = this.selectedRiskPoint && this.selectedRiskPoint.pointCode
      if (!currentCode) {
        this.selectedRiskPoint = null
        return
      }
      this.selectedRiskPoint = this.visibleRiskPoints.find(item => item.pointCode === currentCode) || null
    },
    selectRiskPoint (item) {
      this.selectedRiskPoint = item
    },
    selectMapEvent (item) {
      const targetEvent = item && Array.isArray(item.events) && item.events.length ? item.events[0] : item
      this.selectedMapEvent = targetEvent
      const vehicleCode = this.extractMapEventVehicleCode(targetEvent)
      if (vehicleCode) {
        this.selectVehicleByCode(vehicleCode)
      }
    },
    appendTrailPoint (vehicleCode, position) {
      const current = Array.isArray(this.vehicleTrails[vehicleCode]) ? this.vehicleTrails[vehicleCode].slice() : []
      if (current.length) {
        const lastPoint = current[current.length - 1]
        const sameTs = lastPoint && lastPoint.ts && position.ts && String(lastPoint.ts) === String(position.ts)
        if (sameTs || this.isSameCoordinate(lastPoint, position)) {
          current[current.length - 1] = {
            ...lastPoint,
            ...position
          }
        } else {
          const previousSameIndex = current.findIndex(point => this.isSameCoordinate(point, position))
          if (previousSameIndex >= 0) {
            current.splice(previousSameIndex, 1)
          }
          current.push(position)
        }
      } else {
        current.push(position)
      }
      this.$set(this.vehicleTrails, vehicleCode, current.slice(-60))
    },
    calcTimeGapMs (prevTs, nextTs) {
      if (!prevTs || !nextTs) return null
      const prev = new Date(prevTs).getTime()
      const next = new Date(nextTs).getTime()
      if (!Number.isFinite(prev) || !Number.isFinite(next)) return null
      return Math.abs(next - prev)
    },
    toAbsoluteUrl (path) {
      if (!path) return ''
      if (/^https?:\/\//i.test(path)) return path
      return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
    },
    isPositionMappable (position) {
      if (!this.displayMap || !position) return false
      return position.x !== undefined && position.x !== null && position.y !== undefined && position.y !== null &&
        this.displayMap.width && this.displayMap.height && this.displayMap.resolution
    },
    isEventPositionMappable (position) {
      if (!this.isPositionMappable(position)) return false
      if (!this.displayMap || this.usingMockMap) return true
      const mapId = String(this.displayMap.mapId || '').trim()
      const positionMapId = String((position && position.mapId) || '').trim()
      if (mapId && positionMapId && mapId !== positionMapId) return false
      return true
    },
    isRiskPointVisible (point) {
      if (!this.isPositionMappable(point)) return false
      if (!this.displayMap || this.usingMockMap) return true
      const mapId = String(this.displayMap.mapId || '').trim()
      const mapVersion = String(this.displayMap.mapVersion || '').trim()
      const pointMapId = String((point && point.mapId) || '').trim()
      const pointMapVersion = String((point && point.mapVersion) || '').trim()
      if (mapId && pointMapId && mapId !== pointMapId) return false
      if (mapVersion && pointMapVersion && mapVersion !== pointMapVersion) return false
      return true
    },
    buildVehicleTrailPoints (vehicle) {
      const points = (this.vehicleTrails[vehicle.deviceCode] || []).slice()
      const currentPosition = this.getVehicleDisplayPosition(vehicle)
      const renderPoints = points.length > 1 && this.isSameCoordinate(points[points.length - 1], currentPosition)
        ? points.slice(0, -1)
        : points
      return renderPoints
        .filter(point => this.isEventPositionMappable(point))
        .map((point, index) => ({
          ...point,
          key: `${vehicle.deviceCode}-${point.ts || index}`,
          vehicleId: vehicle.id,
          deviceCode: vehicle.deviceCode,
          hasAlert: vehicle.activeAlerts > 0 || vehicle.activeEmergencies > 0,
          online: vehicle.online
        }))
    },
    buildMapMarkerStyle (position) {
      const map = this.displayMap || {}
      const resolution = Number(map.resolution)
      const width = Number(map.width)
      const height = Number(map.height)
      const originX = Number(map.originX || 0)
      const originY = Number(map.originY || 0)
      const x = Number(position && position.x)
      const y = Number(position && position.y)
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
    buildEventMarkerStyle (item) {
      const base = this.buildMapMarkerStyle(item && item.position)
      const isAlarm = String((item && item.sourceType) || '').toUpperCase() === 'ALARM'
      const baseOffsetX = isAlarm ? 24 : -24
      const baseOffsetY = isAlarm ? -20 : 20
      return {
        ...base,
        transform: `translate(calc(-50% + ${baseOffsetX}px), calc(-50% + ${baseOffsetY}px))`
      }
    },
    aggregateMapEvents (events, sourceType) {
      const list = Array.isArray(events) ? events.slice() : []
      const groups = {}
      list.forEach(item => {
        const position = item && item.position
        const x = Number(position && position.x)
        const y = Number(position && position.y)
        const mapId = String((position && position.mapId) || '')
        const key = `${sourceType}|${mapId}|${Number.isFinite(x) ? x.toFixed(3) : 'nan'}|${Number.isFinite(y) ? y.toFixed(3) : 'nan'}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      })
      return Object.keys(groups).map(key => {
        const samePointList = (groups[key] || []).slice().sort((a, b) => {
          const timeA = new Date(a.occurTime || 0).getTime() || 0
          const timeB = new Date(b.occurTime || 0).getTime() || 0
          return timeB - timeA
        })
        const primary = samePointList[0]
        return {
          ...primary,
          key: `${primary.key}-group`,
          count: samePointList.length,
          eventKeys: samePointList.map(eventItem => eventItem.key),
          events: samePointList
        }
      })
    },
    isEventMarkerSelected (item) {
      if (!item || !this.selectedMapEvent) return false
      if (Array.isArray(item.eventKeys)) {
        return item.eventKeys.includes(this.selectedMapEvent.key)
      }
      return this.selectedMapEvent.key === item.key
    },
    eventMarkerText (item) {
      const prefix = String((item && item.sourceType) || '').toUpperCase() === 'AI' ? 'AI' : '告'
      const count = Number(item && item.count)
      return Number.isFinite(count) && count > 1 ? `${prefix}×${count}` : prefix
    },
    eventMarkerTitle (item) {
      if (!item) return ''
      const count = Number(item.count)
      const suffix = Number.isFinite(count) && count > 1 ? ` | 共${count}条` : ''
      return `${item.title} | ${item.subtitle} | ${this.formatTime(item.occurTime)}${suffix}`
    },
    isSameCoordinate (pointA, pointB) {
      if (!pointA || !pointB) return false
      const xA = Number(pointA.x)
      const yA = Number(pointA.y)
      const xB = Number(pointB.x)
      const yB = Number(pointB.y)
      return Number.isFinite(xA) && Number.isFinite(yA) && Number.isFinite(xB) && Number.isFinite(yB) &&
        Math.abs(xA - xB) < 0.001 && Math.abs(yA - yB) < 0.001
    },
    hasPositionChanged (prev, next) {
      if (!prev && next) return true
      if (prev && !next) return true
      if (!prev && !next) return false
      if (String(prev.ts || '') !== String(next.ts || '')) return true
      if (!this.isSameCoordinate(prev, next)) return true
      return String(prev.mapVersion || '') !== String(next.mapVersion || '') ||
        String(prev.mapId || '') !== String(next.mapId || '')
    },
    vehicleMarkerClass (item) {
      if (this.selectedVehicle && this.selectedVehicle.id === item.id) return 'selected'
      if (item.activeAlerts > 0 || item.activeEmergencies > 0) return 'alert'
      return item.online ? 'online' : 'offline'
    },
    trailMarkerClass (item) {
      if (this.selectedVehicle && this.selectedVehicle.id === item.vehicleId) return 'active'
      if (item.hasAlert) return 'alert'
      return item.online ? 'online' : 'offline'
    },
    buildTrailMarkerStyle (point) {
      const base = this.buildMapMarkerStyle(point)
      return {
        ...base,
        opacity: point && point.trailOpacity !== undefined ? String(point.trailOpacity) : undefined,
        zIndex: '1',
        transform: `translate(-50%, -50%) scale(${point && point.trailScale ? point.trailScale : 1})`
      }
    },
    syncSelectedMapEvent (currentKey) {
      if (!currentKey) {
        if (this.selectedMapEvent && !this.allMapEvents.some(item => item.key === this.selectedMapEvent.key)) {
          this.selectedMapEvent = null
        }
        return
      }
      this.selectedMapEvent = this.allMapEvents.find(item => item.key === currentKey) || null
    },
    normalizeAlarmMapEvent (item) {
      const position = this.extractPositionSnapshot(item)
      if (!position) return null
      const status = String(item.status || '').toUpperCase()
      return {
        key: `alarm-${item.id}`,
        id: item.id,
        sourceType: 'ALARM',
        title: item.alertNo || `ALT-${item.id}`,
        subtitle: this.getAlarmTypeText(item.alertType),
        level: item.level || '--',
        status,
        statusText: this.getAlarmStatusText(status),
        occurTime: item.occurTime || item.createdAt || null,
        position,
        deviceLabel: item.deviceCode || (item.deviceId ? `设备 ID-${item.deviceId}` : '未知设备'),
        alertId: item.id,
        raw: item
      }
    },
    normalizeAiMapEvent (item) {
      const position = this.extractPositionSnapshot(item)
      if (!position) return null
      const confidence = Number(item.confidence)
      return {
        key: `ai-${item.id}`,
        id: item.id,
        sourceType: 'AI',
        title: item.eventNo || `AI-${item.id}`,
        subtitle: `${this.getAiTypeText(item.detectType)}${Number.isFinite(confidence) ? `｜${(confidence * 100).toFixed(1)}%` : ''}`,
        level: item.level || '--',
        status: String(item.status || '').toUpperCase(),
        statusText: this.getAiStatusText(item.status),
        occurTime: item.ts || item.createdAt || null,
        position,
        deviceLabel: item.vehicleCode || (item.vehicleDeviceId ? `车辆 ID-${item.vehicleDeviceId}` : '未知车辆'),
        alertId: item.alertId || null,
        raw: item
      }
    },
    extractPositionSnapshot (item) {
      if (!item) return null
      if (item.positionSnapshot && typeof item.positionSnapshot === 'object') {
        return item.positionSnapshot
      }
      if (item.detail && item.detail.positionSnapshot && typeof item.detail.positionSnapshot === 'object') {
        return item.detail.positionSnapshot
      }
      if (typeof item.positionSnapshot === 'string') {
        return this.parseJsonObject(item.positionSnapshot)
      }
      if (typeof item.detailJson === 'string') {
        const detail = this.parseJsonObject(item.detailJson)
        return detail && detail.positionSnapshot && typeof detail.positionSnapshot === 'object'
          ? detail.positionSnapshot
          : null
      }
      return null
    },
    parseJsonObject (text) {
      if (!text || typeof text !== 'string') return null
      try {
        const parsed = JSON.parse(text)
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch (e) {
        return null
      }
    },
    getAlarmTypeText (type) {
      const map = {
        smoke_high: '烟雾浓度超标',
        temp_high: '环境温度过高',
        temp_env_rise: '环境温度持续上升',
        fire: '明火检测告警'
      }
      return map[type] || type || '系统告警'
    },
    getAlarmStatusText (status) {
      const map = {
        NEW: '待处理',
        ACKED: '处理中',
        PROCESSING: '处理中',
        RESOLVED: '已解决',
        CLOSED: '已关闭'
      }
      return map[String(status || '').toUpperCase()] || (status || '--')
    },
    getAiTypeText (type) {
      const map = {
        smoke: '烟雾检测',
        fire: '明火检测',
        person: '人员闯入',
        vehicle: '车辆违停',
        smoke_high: '高浓度烟雾'
      }
      return map[type] || type || 'AI识别'
    },
    getAiStatusText (status) {
      const map = {
        RECORDED: '仅留痕',
        ALERTED: '已转告警'
      }
      return map[String(status || '').toUpperCase()] || (status || '--')
    },
    getRiskTypeName (type) {
      const map = {
        blind_spot: '视觉盲区',
        water_ponding: '积水区',
        clutter: '杂物区'
      }
      return map[type] || type || '未知风险'
    },
    goToMapEvent (event) {
      if (!event) return
      if (event.sourceType === 'ALARM') {
        this.$router.push({
          path: '/alarm',
          query: { alertId: String(event.alertId || event.id || '') }
        }).catch(() => {})
        return
      }
      this.$router.push({
        path: '/history',
        query: { aiEventId: String(event.id || '') }
      }).catch(() => {})
    },
    goToGroupedMapEvents (group) {
      if (!group || !Array.isArray(group.events) || !group.events.length) return
      if (String(group.sourceType || '').toUpperCase() === 'ALARM') {
        const ids = group.events
          .map(item => Number(item.alertId || item.id))
          .filter(id => Number.isFinite(id) && id > 0)
        if (!ids.length) return
        this.$router.push({
          path: '/alarm',
          query: { alertIds: ids.join(',') }
        }).catch(() => {})
        return
      }
      const ids = group.events
        .map(item => Number(item.id))
        .filter(id => Number.isFinite(id) && id > 0)
      if (!ids.length) return
      this.$router.push({
        path: '/history',
        query: { aiEventIds: ids.join(',') }
      }).catch(() => {})
    },
    shortVehicleLabel (deviceCode) {
      const text = String(deviceCode || '')
      return text.split('-').slice(-1)[0] || text.slice(-3)
    },
    openVehicleMonitorByCode (vehicleCode) {
      if (!vehicleCode) return
      this.$router.push({
        path: '/monitor',
        query: {
          vehicleCode: String(vehicleCode)
        }
      }).catch(() => {})
    },
    syncSelectedSensorDevice () {
      const currentId = this.selectedSensorDevice && this.selectedSensorDevice.id
      if (!currentId) {
        if (this.selectedSensorDevice && !this.sensorDevices.some(item => item.id === this.selectedSensorDevice.id)) {
          this.selectedSensorDevice = null
        }
        return
      }
      this.selectedSensorDevice = this.sensorDevices.find(item => item.id === currentId) || null
    },
    resolveRealtimeSensorDeviceCode (messageData) {
      const candidates = [
        messageData && messageData.deviceCode,
        messageData && messageData.deviceId,
        messageData && messageData.targetCode
      ]
      const found = candidates.find(item => String(item || '').trim())
      return found ? String(found).trim() : ''
    },
    applyRealtimeSensorToCollections (deviceCode, messageData) {
      const normalized = this.normalizeRealtimeSensorMessage(messageData)
      if (!normalized) return false
      let updated = false
      const vehicle = this.vehicles.find(item => item.deviceCode === deviceCode)
      if (vehicle) {
        this.applySensorValueToDevice(vehicle, normalized)
        updated = true
      }
      const sensorDevice = this.sensorDevices.find(item => item.deviceCode === deviceCode)
      if (sensorDevice) {
        this.applySensorValueToDevice(sensorDevice, normalized)
        updated = true
      }
      return updated
    },
    normalizeRealtimeSensorMessage (messageData) {
      if (!messageData) return null
      const sensorType = String(messageData.sensorType || messageData.type || '').trim()
      if (!sensorType) return null
      const ts = messageData.ts || messageData.updatedAt || messageData.time || new Date().toISOString()
      const valueNum = messageData.valueNum !== undefined && messageData.valueNum !== null
        ? Number(messageData.valueNum)
        : Number(messageData.value)
      const valueText = messageData.valueText !== undefined && messageData.valueText !== null
        ? String(messageData.valueText)
        : (messageData.value !== undefined && messageData.value !== null ? String(messageData.value) : '')
      return {
        sensorType,
        ts,
        valueNum: Number.isFinite(valueNum) ? valueNum : null,
        valueText
      }
    },
    applySensorValueToDevice (device, sensorMessage) {
      if (!device || !sensorMessage) return
      const rawType = String(sensorMessage.sensorType || '').toLowerCase()
      const displayValue = sensorMessage.valueNum !== null ? sensorMessage.valueNum : sensorMessage.valueText
      if (rawType.includes('temp')) {
        device.temp = displayValue
      } else if (rawType.includes('smoke') || rawType.includes('smk')) {
        device.smoke = displayValue
      } else {
        const extraSensors = Array.isArray(device.extraSensors) ? device.extraSensors.slice() : []
        const existingIndex = extraSensors.findIndex(item => item.sensorType === sensorMessage.sensorType)
        const nextItem = {
          sensorType: sensorMessage.sensorType,
          displayValue: this.displaySensorRawValue(sensorMessage)
        }
        if (existingIndex >= 0) extraSensors.splice(existingIndex, 1, nextItem)
        else extraSensors.push(nextItem)
        device.extraSensors = extraSensors
      }
      device.sensorTs = sensorMessage.ts
    },
    extractMapEventVehicleCode (event) {
      if (!event) return ''
      const candidates = [
        event.vehicleCode,
        event.raw && event.raw.vehicleCode,
        event.raw && event.raw.deviceCode,
        event.deviceLabel
      ]
      const found = candidates.find(value => this.isVehicleCode(value))
      return found ? String(found).trim() : ''
    },
    calcDistance (pointA, pointB) {
      if (!pointA || !pointB) return 0
      const xA = Number(pointA.x)
      const yA = Number(pointA.y)
      const xB = Number(pointB.x)
      const yB = Number(pointB.y)
      if (![xA, yA, xB, yB].every(Number.isFinite)) return 0
      return Math.sqrt(((xB - xA) ** 2) + ((yB - yA) ** 2))
    },
    formatSpeed (position) {
      if (!position) return '--'
      const vx = Number(position.vx || 0)
      const vy = Number(position.vy || 0)
      if (!Number.isFinite(vx) || !Number.isFinite(vy)) return '--'
      return `${Math.sqrt((vx ** 2) + (vy ** 2)).toFixed(2)} m/s`
    },
    formatYaw (value) {
      const num = Number(value)
      if (!Number.isFinite(num)) return '--'
      return `${num.toFixed(2)} rad`
    },
    formatTime (value) {
      return value ? String(value).replace('T', ' ') : '--'
    },
    formatSensorValue (value, unit) {
      if (value === null || value === undefined || value === '') return '--'
      const num = Number(value)
      return Number.isFinite(num) ? `${num.toFixed(2)} ${unit}` : `${value} ${unit}`
    },
    formatCoordinate (position) {
      if (!position || position.x === undefined || position.y === undefined) return '--'
      return `${Number(position.x).toFixed(2)}, ${Number(position.y).toFixed(2)}`
    },
    formatQuality (value) {
      if (value === null || value === undefined || value === '') return '--'
      const num = Number(value)
      if (!Number.isFinite(num)) return String(value)
      return `${Math.round(num * 100)}%`
    },
    goRoute (path) {
      this.$router.push(path).catch(() => {})
    }
  }
}
</script>

<style scoped>
.overview-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: -24px;
  padding: 24px;
  min-height: calc(100% + 48px);
  background: #f4f7fa;
  box-sizing: border-box;
}

.card-shell {
  background: #f5f9ff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.overview-header,
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.page-subtitle,
.refresh-text,
.hint-text,
.panel-subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.header-actions,
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 18px 20px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.text-green { color: #10b981; }
.text-blue { color: #3b82f6; }
.text-red { color: #ef4444 !important; }
.text-orange { color: #f97316 !important; }

.keyword-input {
  width: 280px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #dbe4ee;
  background: #fff;
  color: #334155;
  outline: none;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-btn,
.btn-primary,
.btn-secondary {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: 0.2s ease;
}

.filter-btn {
  padding: 10px 14px;
  background: #e8eef6;
  color: #64748b;
}

.filter-btn.active {
  background: #3b82f6;
  color: #fff;
}

.btn-primary {
  padding: 10px 16px;
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover { background: #2563eb; }

.btn-secondary {
  padding: 8px 14px;
  background: #e8f1ff;
  color: rgb(16, 46, 87);
}

.btn-secondary:hover { background: #d7e7ff; }

.map-layout {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 16px;
  align-items: start;
}

.map-card,
.focus-card {
  padding: 18px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.panel-title {
  font-size: 16px;
  font-weight: 800;
  color: rgb(16, 46, 87);
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.legend-dot.vehicle.online { background: #10b981; }
.legend-dot.vehicle.offline { background: #94a3b8; }
.legend-dot.vehicle.alert { background: #ef4444; }
.legend-dot.trail { background: #60a5fa; }
.legend-dot.risk { background: #f59e0b; }
.legend-dot.alarm-event { background: #dc2626; }
.legend-dot.ai-event { background: #7c3aed; }

.map-stage {
  margin-top: 14px;
  min-height: 420px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #dbe4ee;
  background: #111827;
}

.map-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.slam-map-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  filter: grayscale(1) contrast(1.15) brightness(1.05);
  background:
    linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03)),
    #111827;
}

.map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
  cursor: pointer;
  border: none;
  padding: 0;
  background: transparent;
}

.trail-marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0.72;
  z-index: 1;
  box-shadow: none;
}

.trail-marker.online { background: #60a5fa; }
.trail-marker.offline { background: #94a3b8; }
.trail-marker.alert { background: #f87171; }
.trail-marker.active {
  width: 12px;
  height: 12px;
  background: #2563eb;
  box-shadow: none;
}

.vehicle-marker {
  min-width: 44px;
  height: 30px;
  padding: 0 8px 0 6px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: none;
  border: 2px solid rgba(255,255,255,0.9);
}

.vehicle-marker-icon {
  font-size: 14px;
}

.vehicle-marker-label {
  line-height: 1;
}

.vehicle-marker.online { background: #10b981; }
.vehicle-marker.offline { background: #64748b; }
.vehicle-marker.alert { background: #ef4444; }
.vehicle-marker.selected { background: #3b82f6; transform: translate(-50%, -50%) scale(1.08); z-index: 3; }

.risk-marker {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.92);
}

.risk-marker.selected {
  box-shadow: 0 0 0 4px rgba(255,255,255,0.4), 0 10px 24px rgba(15, 23, 42, 0.25);
}

.event-marker {
  min-width: 34px;
  height: 28px;
  padding: 0 10px;
  border: 2px solid rgba(255,255,255,0.95);
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  box-shadow: none;
  white-space: nowrap;
}

.alarm-marker {
  background: #dc2626;
  transform: translate(calc(-50% + 24px), calc(-50% - 20px));
}

.ai-marker {
  background: #7c3aed;
  transform: translate(calc(-50% - 24px), calc(-50% + 20px));
}

.event-marker.selected {
  box-shadow: 0 0 0 3px rgba(255,255,255,0.55);
}

@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.map-empty,
.focus-empty,
.empty-block {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
}

.map-empty {
  min-height: 420px;
  background: #111827;
}

.map-meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-item {
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #475569;
  font-weight: 700;
}

.focus-name-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.focus-name-row strong {
  font-size: 22px;
  color: rgb(16, 46, 87);
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.online {
  color: #059669;
  background: #d1fae5;
}

.status-pill.offline {
  color: #ef4444;
  background: #fee2e2;
}

.status-pill.neutral {
  color: #92400e;
  background: #fef3c7;
}

.focus-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}

.focus-section + .risk-focus-section,
.risk-focus-section + .risk-focus-section,
.risk-focus-section + .event-focus-section {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed #dbe4ee;
}

.focus-section-title {
  font-size: 13px;
  font-weight: 800;
  color: #475569;
}

.focus-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.focus-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.focus-item label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
}

.focus-item span {
  font-size: 14px;
  color: #334155;
  font-weight: 800;
}

.focus-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.focus-tag-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-focus-head {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.event-focus-head strong {
  font-size: 18px;
  color: rgb(16, 46, 87);
}

.event-focus-type {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.event-focus-type.alarm {
  color: #b91c1c;
  background: #fee2e2;
}

.event-focus-type.ai {
  color: #6d28d9;
  background: #ede9fe;
}

.focus-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.sensor-section {
  padding: 18px;
}

.sensor-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.sensor-section-meta {
  font-size: 13px;
  color: #475569;
  font-weight: 800;
}

.sensor-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.sensor-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: 0.2s ease;
}

.sensor-card:hover,
.sensor-card.selected {
  border-color: #93c5fd;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
}

.sensor-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.sensor-card-title {
  font-size: 18px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.sensor-card-name,
.sensor-device-type {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.sensor-metric-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.sensor-metric {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sensor-metric.full {
  grid-column: 1 / -1;
}

.sensor-metric label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
}

.sensor-metric strong {
  font-size: 14px;
  color: #334155;
  font-weight: 800;
}

.sensor-empty {
  margin-top: 16px;
  min-height: 120px;
}

.vehicle-card {
  padding: 18px;
  cursor: pointer;
}

.vehicle-card.selected {
  border-color: #93c5fd;
  background: #eef6ff;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.vehicle-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vehicle-title-row h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.vehicle-name,
.vehicle-last-seen {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

.section-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.section-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 800;
  color: rgb(16, 46, 87);
}

.metric-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #475569;
}

.metric-row strong {
  color: #1e293b;
  text-align: right;
  word-break: break-word;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.tag-online {
  color: #059669;
  background: #ecfdf5;
}

.tag-offline {
  color: #ef4444;
  background: #fef2f2;
}

.tag-empty {
  color: #64748b;
  background: #f1f5f9;
}

.card-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.empty-block {
  min-height: 220px;
}

@media (max-width: 1400px) {
  .sensor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .sensor-grid,
  .vehicle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
