<template>
  <div class="alarm-view">
    <div class="alarm-sidebar">
      <div class="sidebar-header">
        <h2 class="page-title">告警中心</h2>
      </div>

      <div class="filter-wrapper">
        <div class="filter-capsule">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: currentFilter === tab.value }"
            @click="changeFilter(tab.value)"
          >
            {{ tab.label }}
            <span v-if="tab.value === 'all'" class="count-num">{{ total }}</span>
            <span v-if="tab.value === 'pending' && pendingCount > 0" class="red-badge">{{ pendingCount }}</span>
          </button>
        </div>
      </div>

      <div class="list-container">
        <div
          v-for="alarm in displayedAlarms"
          :key="alarm.id"
          class="alarm-card"
          :class="{ active: selectedAlarm && selectedAlarm.id === alarm.id }"
          @click="selectAlarm(alarm)"
        >
          <div class="card-meta">
            <div class="meta-left">
              <span class="p-level" :class="alarm.level">{{ alarm.level }} {{ alarm.typeDesc }}</span>
            </div>
            <span class="status-text" :class="alarm.status">{{ getStatusText(alarm.status) }}</span>
          </div>
          <h4 class="card-title">{{ alarm.alertNo }}</h4>
          <p class="card-desc">{{ alarm.descPreview }}</p>
          <div class="card-time">{{ alarm.time }}</div>
        </div>
      </div>

      <div class="list-pagination">
        <el-pagination
          small
          background
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <div class="alarm-main">
      <template v-if="selectedAlarm">
        <div class="main-header">
          <div class="title-area">
            <h3>{{ selectedAlarm.alertNo }}</h3>
            <span class="status-badge" :class="selectedAlarm.status">{{ getStatusText(selectedAlarm.status) }}</span>
          </div>

          <div class="action-buttons">
            <button
              v-if="selectedAlarm.status === 'pending'"
              class="btn-primary"
              @click="confirmAlarm(selectedAlarm)"
            >
              立即确认处理
            </button>
            <button
              v-if="selectedAlarm.status === 'processing'"
              class="btn-success"
              @click="resolveAlarm(selectedAlarm)"
            >
              标记为已解决
            </button>
          </div>
        </div>

        <div class="time-meta">
          <i class="el-icon-time"></i>
          告警时间：{{ selectedAlarm.time }}
        </div>

        <div class="detail-grid">
          <div class="detail-block info-block">
            <h4 class="block-title"><i class="el-icon-warning-outline text-red"></i> 告警详情</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>触发类型</label>
                <span class="text-red">{{ selectedAlarm.typeDesc }}</span>
              </div>
              <div class="info-item">
                <label>严重等级</label>
                <span>{{ selectedAlarm.level }}</span>
              </div>
              <div class="info-item">
                <label>触发设备</label>
                <span>{{ selectedAlarm.device }}</span>
              </div>
              <div class="info-item">
                <label>触发值 / 阈值</label>
                <span class="text-red font-mono">{{ selectedAlarm.triggerValue }} / {{ selectedAlarm.triggerThreshold }}</span>
              </div>
              <div class="info-item col">
                <label>定位坐标</label>
                <span class="font-mono">{{ selectedAlarm.location }}</span>
              </div>
              <div class="info-item col">
                <label>事件描述</label>
                <p>{{ selectedAlarm.descFull }}</p>
              </div>
            </div>
          </div>

          <div class="detail-block video-block" v-loading="evidenceLoading">
            <template v-if="currentEvidence && currentEvidence.mediaUrl">
              <video
                v-if="currentEvidence.isVideo"
                ref="evidenceVideo"
                :key="currentEvidence.mediaUrl"
                class="evidence-media"
                controls
                autoplay
                :muted="evidenceMuted"
                playsinline
                webkit-playsinline="true"
                preload="metadata"
                @loadedmetadata="handleEvidenceLoaded"
                @error="handleEvidenceVideoError"
              >
                <source :src="currentEvidence.mediaUrl" :type="currentEvidence.mimeType || 'video/mp4'">
              </video>

              <img
                v-else
                :key="currentEvidence.mediaUrl"
                :src="currentEvidence.mediaUrl"
                alt="现场证据"
                class="evidence-media image-media"
              >

              <div class="live-watermark">
                <span class="red-dot"></span>
                {{ currentEvidenceLabel }}
              </div>
            </template>

            <div v-else class="empty-evidence">
              <i class="el-icon-picture-outline"></i>
              <p>{{ evidenceEmptyText }}</p>
              <button
                v-if="currentEvidence && currentEvidence.id"
                class="btn-outline-small"
                @click="handleRetryEvidence"
              >
                <i class="el-icon-refresh"></i> 重试生成证据
              </button>
            </div>
          </div>

          <div class="detail-block tech-block">
            <h4 class="block-title"><i class="el-icon-cpu text-red"></i> 规则与定位解析</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>触发规则</label>
                <span class="font-mono text-red">{{ selectedAlarm.ruleType }}</span>
              </div>
              <div class="info-item">
                <label>定位状态</label>
                <span>
                  <span class="status-dot" :class="selectedAlarm.locStatus === 'OK' ? 'success' : 'error'"></span>
                  {{ selectedAlarm.locStatus }}
                </span>
              </div>
              <div class="info-item">
                <label>定位质量</label>
                <span class="font-mono">{{ selectedAlarm.locQuality }}</span>
              </div>
              <div class="info-item">
                <label>航向角</label>
                <span class="font-mono">{{ selectedAlarm.yaw }}</span>
              </div>
            </div>
          </div>

          <div class="detail-block sensor-block">
            <h4 class="block-title"><i class="el-icon-data-line text-red"></i> 触发快照</h4>
            <div class="sensor-cards">
              <div class="sensor-card">
                <div class="sensor-info">
                  <span class="label">环境温度</span>
                  <div class="value-row">
                    <span class="value">{{ selectedAlarm.sensors.temp }} <span class="unit">℃</span></span>
                  </div>
                </div>
                <i class="el-icon-warning-outline text-red icon-large"></i>
              </div>

              <div class="sensor-card">
                <div class="sensor-info">
                  <span class="label">烟雾浓度</span>
                  <div class="value-row">
                    <span class="value">{{ selectedAlarm.sensors.smoke }} <span class="unit">ppm</span></span>
                  </div>
                </div>
                <i class="el-icon-wind-power text-red icon-large"></i>
              </div>
            </div>
          </div>

          <div class="detail-block evidence-list-block" v-if="evidenceList.length > 0">
            <h4 class="block-title"><i class="el-icon-film text-red"></i> 证据列表</h4>
            <div class="evidence-list">
              <button
                v-for="item in evidenceList"
                :key="item.id"
                class="evidence-item"
                :class="{ active: currentEvidence && currentEvidence.id === item.id }"
                @click="useEvidence(item)"
              >
                <div class="evidence-item-title">
                  {{ getEvidenceTypeText(item.evidenceType) }}
                </div>
                <div class="evidence-item-meta">
                  {{ getEvidenceStatusText(item.status) }}
                </div>
              </button>
            </div>
            <div v-if="currentEvidence" class="evidence-status-panel">
              <div><strong>当前证据：</strong>{{ getEvidenceTypeText(currentEvidence.evidenceType) }}</div>
              <div><strong>状态：</strong>{{ getEvidenceStatusText(currentEvidence.status) }}</div>
              <div v-if="currentEvidence.taskId"><strong>任务ID：</strong>{{ currentEvidence.taskId }}</div>
              <div v-if="currentEvidence.attempt"><strong>尝试次数：</strong>{{ currentEvidence.attempt }}</div>
              <div v-if="currentEvidence.phase"><strong>处理阶段：</strong>{{ currentEvidence.phase }}</div>
              <div v-if="currentEvidence.executor"><strong>执行器：</strong>{{ currentEvidence.executor }}</div>
              <div v-if="currentEvidence.startedAt"><strong>开始时间：</strong>{{ formatTime(currentEvidence.startedAt) }}</div>
              <div v-if="currentEvidence.completedAt"><strong>完成时间：</strong>{{ formatTime(currentEvidence.completedAt) }}</div>
              <div v-if="currentEvidence.durationMs"><strong>处理耗时：</strong>{{ currentEvidence.durationMs }} ms</div>
              <div v-if="currentEvidence.engine"><strong>处理引擎：</strong>{{ currentEvidence.engine }}</div>
              <div v-if="currentEvidence.source"><strong>证据来源：</strong>{{ currentEvidence.source }}</div>
              <div v-if="currentEvidence.storagePath"><strong>存储路径：</strong>{{ currentEvidence.storagePath }}</div>
              <div v-if="currentEvidence.playMode"><strong>播放方式：</strong>{{ currentEvidence.playMode }}</div>
              <div v-if="currentEvidence.playMessage"><strong>播放说明：</strong>{{ currentEvidence.playMessage }}</div>
              <div v-if="currentEvidence.errorText" class="error-text"><strong>失败原因：</strong>{{ currentEvidence.errorText }}</div>
              <div v-else-if="String(currentEvidence.status || '').toUpperCase() === 'PROCESSING'" class="processing-text">
                证据生成中，页面会自动刷新状态
              </div>
            </div>
          </div>

          <div class="detail-block evidence-list-block">
            <h4 class="block-title"><i class="el-icon-tickets text-red"></i> 处理时间线</h4>
            <div v-if="alarmActions.length" class="alarm-timeline">
              <div
                v-for="item in alarmActions"
                :key="item.id"
                class="alarm-timeline-item"
              >
                <div class="alarm-timeline-dot"></div>
                <div class="alarm-timeline-content">
                  <div class="alarm-timeline-title">
                    <strong>{{ item.actionText || item.action }}</strong>
                    <span>{{ formatTime(item.actionTime || item.createdAt) }}</span>
                  </div>
                  <div class="alarm-timeline-meta">
                    <span v-if="item.operatorId">操作人：{{ item.operatorId }}</span>
                    <span v-else>系统操作</span>
                  </div>
                  <div v-if="item.remark" class="alarm-timeline-remark">{{ item.remark }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-inline-panel">暂无处理记录</div>
          </div>
        </div>
      </template>

      <div v-else class="empty-detail">
        <i class="el-icon-aim"></i>
        <p>请在左侧选择一条告警记录</p>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getAlarmList,
  getAlarmDetail,
  getAlarmActions,
  getAlarmEvidences,
  ackAlarm,
  closeAlarm,
  getEvidencePlayUrl,
  retryGenerateEvidence
} from '@/api/alarm'
import { API_BASE_URL } from '@/utils/request'

export default {
  name: 'AlarmView',
  data () {
    return {
      currentFilter: 'all',
      tabs: [
        { label: '全部', value: 'all' },
        { label: '未处理', value: 'pending' },
        { label: '处理中', value: 'processing' },
        { label: '已解决', value: 'resolved' }
      ],
      alarms: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      selectedAlarm: null,
      pendingCount: 0,
      evidenceLoading: false,
      evidenceList: [],
      alarmActions: [],
      currentEvidence: null,
      evidenceMuted: true,
      evidenceEmptyText: '暂无可播放证据',
      evidencePollTimer: null,
      evidencePollingBusy: false
    }
  },
  computed: {
    routeAlertIds () {
      const raw = this.$route && this.$route.query ? this.$route.query.alertIds : ''
      return String(raw || '')
        .split(',')
        .map(item => Number(String(item).trim()))
        .filter(id => Number.isFinite(id) && id > 0)
    },
    scopedAlarms () {
      if (!this.routeAlertIds.length) return this.alarms
      const idSet = new Set(this.routeAlertIds)
      return this.alarms.filter(item => idSet.has(Number(item.id)))
    },
    displayedAlarms () {
      if (!this.routeAlertIds.length) return this.filteredAlarms
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredAlarms.slice(start, start + this.pageSize)
    },
    filteredAlarms () {
      if (this.currentFilter === 'all') return this.scopedAlarms
      return this.scopedAlarms.filter(item => item.status === this.currentFilter)
    },
    currentEvidenceLabel () {
      if (!this.currentEvidence) return 'EVIDENCE RECORD'
      return this.getEvidenceTypeText(this.currentEvidence.evidenceType)
    }
  },
  watch: {
    filteredAlarms (list) {
      if (!list.length) {
        this.selectedAlarm = null
        this.evidenceList = []
        this.alarmActions = []
        this.currentEvidence = null
        this.stopEvidencePolling()
        return
      }
      if (!this.selectedAlarm || !list.find(item => item.id === this.selectedAlarm.id)) {
        this.selectAlarm(list[0])
      }
    }
  },
  beforeDestroy () {
    this.stopEvidencePolling()
  },
  created () {
    this.fetchAlarms()
  },
  methods: {
    formatTime (timeStr) {
      return timeStr ? String(timeStr).replace('T', ' ') : '--'
    },
    formatNumber (value, digits = 2) {
      if (value === null || value === undefined || value === '') return '--'
      const num = Number(value)
      return Number.isFinite(num) ? num.toFixed(digits) : String(value)
    },
    mapAlarmStatus (status) {
      const raw = String(status || 'NEW').toUpperCase()
      if (raw === 'NEW') return 'pending'
      if (raw === 'ACKED' || raw === 'PROCESSING') return 'processing'
      if (raw === 'CLOSED' || raw === 'RESOLVED') return 'resolved'
      return 'pending'
    },
    mapFilterToApiStatus (filter) {
      const value = String(filter || '').toLowerCase()
      if (!value || value === 'all') return ''
      if (value === 'pending') return 'NEW'
      if (value === 'processing') return 'ACKED'
      if (value === 'resolved') return 'CLOSED'
      return value.toUpperCase()
    },
    getStatusText (status) {
      return {
        pending: '未处理',
        processing: '处理中',
        resolved: '已解决'
      }[status] || '未知'
    },
    getEvidenceTypeText (type) {
      return {
        CLIP: '视频证据',
        SNAPSHOT: '图片证据'
      }[String(type || '').toUpperCase()] || (type || '证据')
    },
    getEvidenceStatusText (status) {
      const raw = String(status || '').toUpperCase()
      return {
        SUCCESS: '已生成',
        PROCESSING: '生成中',
        FAILED: '生成失败',
        EXPIRED: '已过期'
      }[raw] || (status || '未知状态')
    },
    parseEvidenceMeta (metaJson) {
      if (!metaJson) return {}
      try {
        return JSON.parse(metaJson) || {}
      } catch (e) {
        return {}
      }
    },
    normalizeEvidence (evidence) {
      const meta = this.parseEvidenceMeta(evidence && evidence.metaJson)
      return {
        ...evidence,
        taskMeta: meta,
        attempt: meta.attempt,
        taskId: meta.taskId,
        phase: meta.phase,
        executor: meta.executor,
        startedAt: meta.startedAt,
        completedAt: meta.completedAt,
        durationMs: meta.durationMs,
        engine: meta.engine || meta.clipEngine,
        source: meta.clipSource || meta.source || meta.api,
        storagePath: meta.storagePath,
        playMessage: evidence && evidence.playMessage ? evidence.playMessage : '',
        playMode: evidence && evidence.playMode ? evidence.playMode : '',
        errorText: (evidence && evidence.errorMsg) || meta.error || ''
      }
    },
    changeFilter (value) {
      this.currentFilter = value
      this.currentPage = 1
      this.fetchAlarms()
    },
    handlePageChange (page) {
      this.currentPage = page
      this.fetchAlarms()
    },
    handlePageSizeChange (size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchAlarms()
    },
    sortAlarmList (list) {
      return (Array.isArray(list) ? list.slice() : []).sort((a, b) => {
        const timeA = new Date(((a && a.raw && (a.raw.occurTime || a.raw.createdAt)) || a.time || '').replace(' ', 'T')).getTime() || 0
        const timeB = new Date(((b && b.raw && (b.raw.occurTime || b.raw.createdAt)) || b.time || '').replace(' ', 'T')).getTime() || 0
        return timeB - timeA
      })
    },
    async fetchPendingCount () {
      if (this.routeAlertIds.length) {
        this.pendingCount = this.scopedAlarms.filter(item => item.status === 'pending').length
        return
      }
      try {
        const res = await getAlarmList(1, 1, this.mapFilterToApiStatus('pending'))
        this.pendingCount = Number((res.data && res.data.total) || 0)
      } catch (e) {
        this.pendingCount = 0
      }
    },
    toAbsoluteApiUrl (path) {
      if (!path) return ''
      if (/^https?:\/\//i.test(path)) return path
      return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
    },
    parseAlarmItem (item) {
      let detail = {}
      try {
        detail = JSON.parse(item.detailJson || '{}')
      } catch (e) {}

      const typeMap = {
        smoke_high: '烟雾浓度超标',
        temp_high: '环境温度过高',
        fire: '明火检测告警'
      }
      const typeDesc = typeMap[item.alertType] || item.alertType || '系统告警'
      const position = detail.positionSnapshot || {}
      const sensorType = String(detail.sensorType || '').toLowerCase()
      const currentValue = this.formatNumber(detail.value, 2)
      const thresholdValue = detail.threshold !== undefined && detail.threshold !== null ? detail.threshold : '--'

      return {
        id: item.id,
        alertNo: item.alertNo || `ALT-${item.id}`,
        level: item.level || 'P1',
        status: this.mapAlarmStatus(item.status),
        typeDesc,
        time: this.formatTime(item.occurTime || item.createdAt),
        triggerValue: currentValue,
        triggerThreshold: thresholdValue,
        location: position.x !== undefined && position.y !== undefined
          ? `X: ${position.x}, Y: ${position.y}${position.mapVersion ? `, map=${position.mapVersion}` : ''}`
          : `设备节点 ID-${item.deviceId || '--'}`,
        descPreview: `检测到 [${typeDesc}]，当前值 ${currentValue}，请及时处置`,
        descFull: `系统检测到 [${typeDesc}]，当前触发值为 ${currentValue}，阈值为 ${thresholdValue}。请确认现场情况并按流程完成闭环处置。`,
        device: item.deviceCode || `ID-${item.deviceId || '--'}`,
        ruleType: detail.ruleType === 'threshold' ? '阈值触发' : (detail.ruleType || '系统规则'),
        locStatus: position.locStatus || 'UNKNOWN',
        locQuality: position.quality !== undefined && position.quality !== null
          ? `${Math.round(Number(position.quality) * 100)}%`
          : '--',
        yaw: position.yaw !== undefined && position.yaw !== null ? String(position.yaw) : '--',
        sensors: {
          temp: sensorType.includes('temp') ? currentValue : '--',
          smoke: sensorType.includes('smoke') || sensorType.includes('smk') ? currentValue : '--'
        },
        raw: item
      }
    },
    getRouteAlertId () {
      const raw = this.$route && this.$route.query ? this.$route.query.alertId : null
      const id = Number(raw)
      return Number.isFinite(id) && id > 0 ? id : null
    },
    async fetchAlarms () {
      try {
        const currentId = this.selectedAlarm && this.selectedAlarm.id
        const routeAlertId = this.getRouteAlertId()
        const routeScopedIds = Array.from(new Set([
          ...this.routeAlertIds,
          ...(routeAlertId ? [routeAlertId] : [])
        ]))
        let alarms = []
        if (routeScopedIds.length) {
          this.currentFilter = 'all'
          const detailResults = await Promise.allSettled(routeScopedIds.map(id => getAlarmDetail(id)))
          detailResults.forEach(result => {
            if (result.status !== 'fulfilled') return
            const detailAlarm = result.value && result.value.data ? this.parseAlarmItem(result.value.data) : null
            if (detailAlarm) alarms.push(detailAlarm)
          })
          alarms = this.sortAlarmList(alarms)
          this.alarms = alarms
          this.total = this.filteredAlarms.length
          const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize))
          if (this.currentPage > maxPage) this.currentPage = maxPage
          await this.fetchPendingCount()
        } else {
          const res = await getAlarmList(this.currentPage, this.pageSize, this.mapFilterToApiStatus(this.currentFilter))
          const list = (res.data && res.data.list) || []
          alarms = list.map(this.parseAlarmItem)
          this.alarms = alarms
          this.total = Number((res.data && res.data.total) || alarms.length)
          await this.fetchPendingCount()
        }
        let nextAlarm = routeAlertId
          ? this.alarms.find(item => item.id === routeAlertId)
          : null

        nextAlarm = nextAlarm ||
          this.displayedAlarms.find(item => item.id === currentId) ||
          this.displayedAlarms[0] ||
          this.filteredAlarms[0] ||
          this.alarms[0] ||
          null
        if (nextAlarm) {
          await this.selectAlarm(nextAlarm)
        } else {
          this.selectedAlarm = null
          this.evidenceList = []
          this.alarmActions = []
          this.currentEvidence = null
          this.stopEvidencePolling()
        }
      } catch (error) {
        this.$message.error(error || '获取告警列表失败')
      }
    },
    async selectAlarm (alarm) {
      if (!alarm) return
      this.selectedAlarm = alarm
      await Promise.all([
        this.loadAlarmEvidences(alarm.id),
        this.loadAlarmActions(alarm.id)
      ])
    },
    pickPreferredEvidence (list) {
      const items = Array.isArray(list) ? list : []
      return items.find(item => item.status === 'SUCCESS' && String(item.evidenceType).toUpperCase() === 'CLIP') ||
        items.find(item => item.status === 'SUCCESS' && String(item.evidenceType).toUpperCase() === 'SNAPSHOT') ||
        items.find(item => String(item.evidenceType).toUpperCase() === 'CLIP') ||
        items.find(item => item.status === 'SUCCESS') ||
        items[0] ||
        null
    },
    async loadAlarmEvidences (alertId) {
      const currentEvidenceId = this.currentEvidence && this.currentEvidence.id
      this.evidenceLoading = true
      this.evidenceList = []
      this.currentEvidence = null
      this.evidenceEmptyText = '暂无可播放证据'

      try {
        const res = await getAlarmEvidences(alertId)
        this.evidenceList = Array.isArray(res.data) ? res.data.map(item => this.normalizeEvidence(item)) : []

        if (!this.evidenceList.length) {
          this.evidenceEmptyText = '当前告警暂无证据文件'
          this.stopEvidencePolling()
          return
        }

        const preferred = this.evidenceList.find(item => item.id === currentEvidenceId) || this.pickPreferredEvidence(this.evidenceList)
        await this.useEvidence(preferred)
        this.ensureEvidencePolling()
      } catch (error) {
        this.evidenceEmptyText = error || '获取告警证据失败'
        this.stopEvidencePolling()
      } finally {
        this.evidenceLoading = false
      }
    },
    async loadAlarmActions (alertId) {
      try {
        const res = await getAlarmActions(alertId)
        this.alarmActions = Array.isArray(res.data)
          ? res.data.slice().sort((a, b) => new Date(b.actionTime || b.createdAt || 0).getTime() - new Date(a.actionTime || a.createdAt || 0).getTime())
          : []
      } catch (error) {
        this.alarmActions = []
      }
    },
    async useEvidence (evidence) {
      if (!evidence) return

      const normalized = {
        ...this.normalizeEvidence(evidence),
        isVideo: String(evidence.evidenceType || '').toUpperCase() === 'CLIP' ||
          String(evidence.mimeType || '').toLowerCase().includes('video'),
        mimeType: evidence.mimeType || '',
        mediaUrl: ''
      }

      this.currentEvidence = normalized
      this.evidenceMuted = true

      if (String(evidence.status || '').toUpperCase() !== 'SUCCESS') {
        this.evidenceEmptyText = `当前证据状态：${this.getEvidenceStatusText(evidence.status)}`
        return
      }

      try {
        const res = await getEvidencePlayUrl(evidence.id)
        const playData = res.data || {}
        if (!playData.playUrl) {
          this.evidenceEmptyText = '后端未返回可用播放地址'
          return
        }

        this.currentEvidence = {
          ...normalized,
          mimeType: playData.mimeType || normalized.mimeType,
          isVideo: normalized.isVideo || String(playData.mimeType || '').toLowerCase().includes('video'),
          mediaUrl: this.toAbsoluteApiUrl(playData.playUrl),
          playMode: playData.playMode || '',
          playMessage: playData.message || '',
          errorText: normalized.errorText || ''
        }
        this.evidenceEmptyText = '暂无可播放证据'
      } catch (error) {
        this.evidenceEmptyText = error || '获取证据播放地址失败'
      }
    },
    async confirmAlarm (alarm) {
      this.$confirm('确定已收到该告警并开始处理吗？确认后状态将切换为“处理中”。', '处理确认', {
        confirmButtonText: '确认处理',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await ackAlarm(alarm.id, '前端确认：已接警，开始处置')
          this.$message.success(`告警 [${alarm.alertNo}] 已切换为处理中`)
          await this.fetchAlarms()
        } catch (error) {
          this.$message.error(error || '告警确认失败')
        }
      }).catch(() => {})
    },
    async resolveAlarm (alarm) {
      this.$prompt('请输入处理结果备注（可选）', '关闭告警', {
        confirmButtonText: '确认关闭',
        cancelButtonText: '取消',
        inputValue: '前端处理完成，告警闭环'
      }).then(async ({ value }) => {
        try {
          await closeAlarm(alarm.id, value || '前端处理完成，告警闭环')
          this.$message.success(`告警 [${alarm.alertNo}] 已标记为已解决`)
          await this.fetchAlarms()
        } catch (error) {
          this.$message.error(error || '关闭告警失败')
        }
      }).catch(() => {})
    },
    async handleRetryEvidence () {
      if (!this.currentEvidence || !this.currentEvidence.id) return
      try {
        await retryGenerateEvidence(this.currentEvidence.id)
        this.$message.success('已发送重新生成指令，请稍后刷新查看')
        if (this.selectedAlarm) {
          await this.loadAlarmEvidences(this.selectedAlarm.id)
        }
      } catch (error) {
        this.$message.error(error || '重试生成失败')
      }
    },
    handleEvidenceLoaded () {
      this.$nextTick(() => {
        const video = this.$refs.evidenceVideo
        if (video) {
          video.muted = this.evidenceMuted
          video.play().catch(() => {})
        }
      })
    },
    handleEvidenceVideoError () {
      this.evidenceEmptyText = '视频证据加载失败'
    },
    ensureEvidencePolling () {
      const needPolling = this.evidenceList.some(item => String(item.status || '').toUpperCase() === 'PROCESSING')
      if (!needPolling) {
        this.stopEvidencePolling()
        return
      }
      if (this.evidencePollTimer) return
      this.evidencePollTimer = setInterval(() => {
        this.refreshEvidenceStatus()
      }, 5000)
    },
    stopEvidencePolling () {
      if (this.evidencePollTimer) {
        clearInterval(this.evidencePollTimer)
        this.evidencePollTimer = null
      }
    },
    async refreshEvidenceStatus () {
      if (!this.selectedAlarm || this.evidencePollingBusy) return
      this.evidencePollingBusy = true
      try {
        await this.loadAlarmEvidences(this.selectedAlarm.id)
      } finally {
        this.evidencePollingBusy = false
      }
    }
  }
}
</script>

<style scoped>
.alarm-view { display: flex; box-sizing: border-box; background-color: #f4f7fa; color: #334155; margin: -24px; height: calc(100% + 48px); }
.text-red { color: #ef4444 !important; }
.font-mono { font-family: monospace; font-weight: bold; }

.alarm-sidebar { width: 400px; display: flex; flex-direction: column; background-color: #f0f4f8; border-right: 1px solid #e2e8f0; overflow: hidden; border-radius: 15px; }
.sidebar-header { padding: 20px 20px 12px 20px; }
.page-title { margin: 0; font-size: 30px; font-weight: 900; color: rgb(16, 46, 87); }
.filter-wrapper { padding: 0 1px 5px 1px; border-bottom: 1px solid #f5f9ff; }
.filter-capsule { display: flex; background: #f5f9ff; border-radius: 6px; padding: 4px; justify-content: space-between; }
.tab-btn { position: relative; flex: 1; background: transparent; border: none; color: #64748b; padding: 6px 0; border-radius: 4px; cursor: pointer; transition: 0.2s; font-size: 13px; font-weight: bold; }
.tab-btn:hover { color: rgb(16, 46, 87); }
.tab-btn.active { background: #fff; color: rgb(16, 46, 87); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.count-num { font-size: 12px; margin-left: 2px; opacity: 0.7; }
.red-badge { position: absolute; top: -6px; right: 2px; background: #3b82f6; color: #f5f9ff; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #f5f9ff; }

.list-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.list-container::-webkit-scrollbar { width: 4px; }
.list-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.list-pagination { padding: 10px 12px 14px; border-top: 1px solid #e2e8f0; background: #f5f9ff; }

.alarm-card { cursor: pointer; padding: 16px 20px; border-bottom: 1px solid #f5f9ff; border-left: 4px solid transparent; transition: all 0.2s ease; background-color: #f5f9ff; }
.alarm-card:hover { background: #f8fafc; }
.alarm-card.active { background-color: #eff6ff; border-left: 4px solid #3b82f6 !important; }

.card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; }
.meta-left { display: flex; align-items: center; gap: 8px; }
.p-level { font-weight: bold; padding: 2px 6px; border-radius: 4px; }
.p-level.P0 { color: #ef4444; background: #fee2e2; }
.p-level.P1 { color: #f97316; background: #ffedd5; }
.p-level.P2 { color: #3b82f6; background: #dbeafe; }
.status-text { font-weight: bold; }
.status-text.pending { color: #3b82f6; }
.status-text.processing { color: #f97316; }
.status-text.resolved { color: #10b981; }
.card-title { margin: 0 0 6px 0; font-size: 15px; font-family: monospace; font-weight: bold; color: rgb(16, 46, 87); }
.card-desc { margin: 0 0 10px 0; font-size: 13px; color: #64748b; line-height: 1.5; }
.card-time { font-size: 12px; color: #94a3b8; font-family: monospace; }

.alarm-main { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; overflow-y: auto; }
.main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 16px; }
.title-area { display: flex; align-items: center; gap: 12px; }
.title-area h3 { margin: 0; font-size: 24px; font-family: monospace; font-weight: 900; color: rgb(16, 46, 87); }
.status-badge { font-size: 12px; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
.status-badge.pending { color: #ef4444; background: #fee2e2; }
.status-badge.processing { color: #ea580c; background: #ffedd5; }
.status-badge.resolved { color: #059669; background: #d1fae5; }

.action-buttons { display: flex; gap: 10px; }
.btn-primary,
.btn-success {
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  font-size: 13px;
}
.btn-primary { background: #3b82f6; }
.btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
.btn-success { background: #10b981; }
.btn-success:hover { background: #059669; transform: translateY(-1px); }

.time-meta { font-family: monospace; color: #94a3b8; font-size: 13px; margin-bottom: 20px; font-weight: bold; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-block { background: #f5f9ff; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02); }
.block-title { margin: 0 0 16px 0; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 8px; color: rgb(16, 46, 87); }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-item label { font-size: 12px; color: #94a3b8; font-weight: bold; }
.info-item span { font-size: 14px; color: #334155; font-weight: bold; }
.info-item.col { grid-column: 1 / -1; }
.info-item.col p { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #f1f5f9; }

.video-block { padding: 0; position: relative; overflow: hidden; display: flex; min-height: 320px; }
.evidence-media { width: 100%; height: 100%; object-fit: contain; display: block; background: #000; }
.image-media { background: #0f172a; }
.live-watermark {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: rgba(0,0,0,0.5);
  padding: 4px 10px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.red-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 6px #ef4444; animation: blink 1.5s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.sensor-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sensor-card { background: #f5f9ff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
.sensor-card:hover { border-color: #cbd5e1; background: #f1f5f9; }
.sensor-info { display: flex; flex-direction: column; gap: 4px; }
.sensor-info .label { font-size: 12px; color: #64748b; font-weight: bold; }
.sensor-info .value { font-size: 20px; font-weight: 900; color: rgb(16, 46, 87); font-family: monospace; }
.sensor-info .unit { font-size: 12px; }
.icon-large { font-size: 24px; opacity: 0.8; }

.evidence-list-block { grid-column: 1 / -1; }
.evidence-list { display: flex; gap: 12px; flex-wrap: wrap; }
.evidence-item {
  min-width: 140px;
  border: 1px solid #dbe4ee;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}
.evidence-item.active { border-color: #3b82f6; background: #eff6ff; }
.evidence-item-title { font-size: 14px; font-weight: 700; color: #1e293b; }
.evidence-item-meta { margin-top: 6px; font-size: 12px; color: #64748b; }
.evidence-status-panel { margin-top: 16px; padding: 12px 14px; border-radius: 8px; background: #fff; border: 1px solid #dbe4ee; font-size: 13px; line-height: 1.8; color: #475569; }
.processing-text { color: #d97706; }
.error-text { color: #dc2626; }
.alarm-timeline { display: flex; flex-direction: column; gap: 14px; }
.alarm-timeline-item { display: flex; gap: 12px; }
.alarm-timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; margin-top: 7px; flex-shrink: 0; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12); }
.alarm-timeline-content { flex: 1; border-bottom: 1px dashed #dbe4ee; padding-bottom: 14px; }
.alarm-timeline-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #1e293b; }
.alarm-timeline-title span { font-size: 12px; color: #94a3b8; font-family: monospace; }
.alarm-timeline-meta { margin-top: 6px; font-size: 12px; color: #64748b; font-weight: 700; }
.alarm-timeline-remark { margin-top: 6px; font-size: 13px; color: #475569; line-height: 1.7; }
.empty-inline-panel { padding: 18px 0; color: #94a3b8; font-size: 13px; text-align: center; }

.empty-detail { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 16px; font-weight: bold; }
.empty-detail i { font-size: 48px; color: #cbd5e1; }
.empty-evidence { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f1f5f9; color: #94a3b8; gap: 12px; font-weight: bold; text-align: center; padding: 20px; box-sizing: border-box; }
.empty-evidence i { font-size: 36px; color: #cbd5e1; }
.empty-evidence p { margin: 0; font-size: 13px; max-width: 360px; line-height: 1.7; }
.btn-outline-small { background: transparent; border: 1px solid #3b82f6; color: #3b82f6; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: 0.2s; font-weight: bold; }
.btn-outline-small:hover { background: #eff6ff; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.status-dot.success { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot.error { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
</style>
