<template>
  <div>
    <div class="vehicle-grid" v-loading="loading">
      <div
        v-for="item in filteredVehicles"
        :key="item.id"
        class="vehicle-card card-shell"
        :class="{ selected: selectedVehicleId === item.id }"
        @click="$emit('select-vehicle', item)"
      >
        <div class="vehicle-header">
          <div>
            <div class="vehicle-title-row">
              <h3>{{ item.deviceCode }}</h3>
              <span class="status-pill" :class="item.online ? 'online' : 'offline'">
                {{ item.online ? '在线' : '离线' }}
              </span>
            </div>
            <div class="vehicle-name">{{ item.deviceName || '未命名车辆设备' }}</div>
          </div>
          <div class="vehicle-last-seen">
            最近在线：{{ formatTime(item.lastOnlineTime) }}
          </div>
        </div>

        <div class="section-grid">
          <div class="section-card">
            <div class="section-title">视频状态</div>
            <div class="metric-row">
              <span>在线路数</span>
              <strong>{{ item.onlineCameraCount }}/{{ item.cameraCount }}</strong>
            </div>
            <div class="metric-row">
              <span>主摄像头</span>
              <strong>{{ item.primaryCameraId || '--' }}</strong>
            </div>
            <div class="tag-list">
              <span
                v-for="cam in item.cameras"
                :key="cam.cameraId"
                class="mini-tag"
                :class="cam.online ? 'tag-online' : 'tag-offline'"
              >
                {{ cam.cameraId }}
              </span>
              <span v-if="!item.cameras.length" class="mini-tag tag-empty">未配置视频流</span>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">传感器状态</div>
            <div class="metric-row">
              <span>温度</span>
              <strong>{{ formatSensorValue(item.temp, '℃') }}</strong>
            </div>
            <div class="metric-row">
              <span>烟雾</span>
              <strong>{{ formatSensorValue(item.smoke, 'ppm') }}</strong>
            </div>
            <div class="metric-row">
              <span>最新上报</span>
              <strong>{{ formatTime(item.sensorTs) }}</strong>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">定位状态</div>
            <template v-if="resolveDisplayPosition(item)">
              <div class="metric-row">
                <span>当前位置</span>
                <strong>{{ formatCoordinate(resolveDisplayPosition(item)) }}</strong>
              </div>
              <div class="metric-row">
                <span>地图版本</span>
                <strong>{{ resolveDisplayPosition(item).mapVersion || '--' }}</strong>
              </div>
              <div class="metric-row">
                <span>定位质量</span>
                <strong>{{ formatQuality(resolveDisplayPosition(item).quality) }}</strong>
              </div>
              <div class="metric-row">
                <span>定位状态</span>
                <strong>{{ resolveDisplayPosition(item).locStatus || '--' }}</strong>
              </div>
              <div class="metric-row">
                <span>移动速度</span>
                <strong>{{ formatSpeed(resolveDisplayPosition(item)) }}</strong>
              </div>
              <div class="metric-row">
                <span>更新时间</span>
                <strong>{{ formatTime(resolveDisplayPosition(item).ts) }}</strong>
              </div>
            </template>
            <template v-else>
              <div class="metric-row">
                <span>当前位置</span>
                <strong>--</strong>
              </div>
              <div class="metric-row">
                <span>地图版本</span>
                <strong>--</strong>
              </div>
              <div class="metric-row">
                <span>定位质量</span>
                <strong>--</strong>
              </div>
              <div class="metric-row">
                <span>定位状态</span>
                <strong>--</strong>
              </div>
              <div class="metric-row">
                <span>移动速度</span>
                <strong>--</strong>
              </div>
              <div class="metric-row">
                <span>更新时间</span>
                <strong>--</strong>
              </div>
            </template>
          </div>

          <div class="section-card">
            <div class="section-title">告警 / 应急</div>
            <div class="metric-row">
              <span>未关闭告警</span>
              <strong class="text-red">{{ item.activeAlerts }}</strong>
            </div>
            <div class="metric-row">
              <span>最近告警</span>
              <strong>{{ formatTime(item.lastAlertTime) }}</strong>
            </div>
            <div class="metric-row">
              <span>处理中应急</span>
              <strong class="text-orange">{{ item.activeEmergencies }}</strong>
            </div>
            <div class="metric-row">
              <span>最近应急</span>
              <strong>{{ formatTime(item.lastEmergencyTime) }}</strong>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-secondary" @click.stop="$emit('route', '/monitor')">查看监控</button>
          <button class="btn-secondary" @click.stop="$emit('route', '/alarm')">查看告警</button>
          <button class="btn-secondary" @click.stop="$emit('route', '/task')">查看应急</button>
        </div>
      </div>

      <div v-if="!filteredVehicles.length && !loading" class="empty-block card-shell">
        暂无车辆状态数据
      </div>
    </div>

    <div class="sensor-section card-shell" v-loading="loading">
      <div class="sensor-section-header">
        <div>
          <div class="panel-title">在线传感器设备</div>
          <div class="panel-subtitle">展示在线的非车辆传感器设备，便于查看最新上报值</div>
        </div>
        <div class="sensor-section-meta">当前在线：{{ onlineSensorDevices.length }}</div>
      </div>

      <div v-if="onlineSensorDevices.length" class="sensor-grid">
        <div
          v-for="item in onlineSensorDevices"
          :key="item.id"
          class="sensor-card"
          :class="{ selected: selectedSensorDeviceId === item.id }"
          @click="$emit('select-sensor-device', item)"
        >
          <div class="sensor-card-head">
            <div>
              <div class="sensor-card-title">{{ item.deviceCode }}</div>
              <div class="sensor-card-name">{{ item.deviceName || '未命名传感器设备' }}</div>
            </div>
            <span class="status-pill online">在线</span>
          </div>

          <div class="sensor-device-type">{{ item.deviceType || 'sensor' }}</div>

          <div class="sensor-metric-grid">
            <div class="sensor-metric">
              <label>温度</label>
              <strong>{{ formatSensorValue(item.temp, '℃') }}</strong>
            </div>
            <div class="sensor-metric">
              <label>烟雾</label>
              <strong>{{ formatSensorValue(item.smoke, 'ppm') }}</strong>
            </div>
            <div class="sensor-metric full">
              <label>最新上报</label>
              <strong>{{ formatTime(item.sensorTs || item.lastOnlineTime) }}</strong>
            </div>
          </div>

          <div v-if="item.extraSensors.length" class="tag-list">
            <span
              v-for="sensor in item.extraSensors"
              :key="`${item.deviceCode}-${sensor.sensorType}`"
              class="mini-tag tag-online"
            >
              {{ sensor.sensorType }}: {{ sensor.displayValue }}
            </span>
          </div>

          <div class="card-actions">
            <button class="btn-secondary" @click.stop="$emit('route', '/alarm')">查看告警</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-block sensor-empty">
        当前暂无在线传感器设备
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VehicleOverviewStaticPanels',
  props: {
    filteredVehicles: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    onlineSensorDevices: {
      type: Array,
      default: () => []
    },
    selectedVehicleId: {
      type: [Number, String],
      default: null
    },
    selectedSensorDeviceId: {
      type: [Number, String],
      default: null
    },
    vehiclePositionsMap: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    resolveDisplayPosition (item) {
      if (!item || !item.deviceCode) return item && item.position ? item.position : null
      return this.vehiclePositionsMap[item.deviceCode] || item.position || null
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
    formatSpeed (position) {
      if (!position) return '--'
      const vx = Number(position.vx || 0)
      const vy = Number(position.vy || 0)
      if (!Number.isFinite(vx) || !Number.isFinite(vy)) return '--'
      return `${Math.sqrt((vx ** 2) + (vy ** 2)).toFixed(2)} m/s`
    }
  }
}
</script>

<style scoped>
.card-shell {
  background: #f5f9ff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.panel-title {
  font-size: 16px;
  font-weight: 800;
  color: rgb(16, 46, 87);
}

.panel-subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
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

.btn-secondary {
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: 0.2s ease;
  background: #e8f1ff;
  color: rgb(16, 46, 87);
}

.btn-secondary:hover {
  background: #d7e7ff;
}

.text-red { color: #ef4444 !important; }
.text-orange { color: #f97316 !important; }

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
}

.sensor-section {
  margin-top: 16px;
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
  min-height: 120px;
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
