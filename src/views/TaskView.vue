<template>
  <div class="emergency-view">
    <div class="page-header card-shell">
      <div>
        <h2 class="page-title">应急处置中心</h2>
        <p class="page-subtitle">覆盖一键报警、派发处置、关联告警、证据状态与处置时间线。</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="fetchEmergencies">刷新</button>
        <button class="btn-primary" @click="openCreateDialog">新建应急</button>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card card-shell">
        <div class="stat-label">事件总数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">待派发</div>
        <div class="stat-value text-red">{{ stats.pending }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">处理中</div>
        <div class="stat-value text-orange">{{ stats.dispatched }}</div>
      </div>
      <div class="stat-card card-shell">
        <div class="stat-label">已关闭</div>
        <div class="stat-value text-green">{{ stats.closed }}</div>
      </div>
    </div>

    <div class="workspace">
      <div class="left-panel card-shell">
        <div class="panel-header">
          <div class="panel-title">事件列表</div>
          <div class="filter-group">
            <button
              v-for="item in statusTabs"
              :key="item.value"
              class="filter-btn"
              :class="{ active: currentFilter === item.value }"
              @click="changeFilter(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="event-list" v-loading="listLoading">
          <div
            v-for="item in displayedEmergencies"
            :key="item.id"
            class="event-card"
            :class="{ active: selectedEmergency && selectedEmergency.id === item.id }"
            @click="selectEmergency(item)"
          >
            <div class="event-card-top">
              <div class="event-no">{{ item.emergencyNo }}</div>
              <span class="status-pill" :class="item.statusClass">{{ item.statusText }}</span>
            </div>
            <div class="event-desc">{{ item.remark || '未填写备注' }}</div>
            <div class="event-meta">
              <span>关联告警：{{ item.alertNo || '--' }}</span>
              <span>{{ item.triggerTimeText }}</span>
            </div>
          </div>

          <div v-if="!displayedEmergencies.length && !listLoading" class="empty-state">
            暂无匹配的应急事件
          </div>
        </div>

        <div class="list-pagination">
          <el-pagination
            small
            background
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            :total="total"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </div>

      <div class="right-panel" v-loading="detailLoading">
        <template v-if="selectedEmergency">
          <div class="card-shell detail-card">
            <div class="detail-header">
              <div>
                <div class="detail-title-row">
                  <h3>{{ selectedEmergency.emergencyNo }}</h3>
                  <span class="status-pill" :class="selectedEmergency.statusClass">{{ selectedEmergency.statusText }}</span>
                </div>
                <div class="detail-subtitle">
                  触发时间：{{ selectedEmergency.triggerTimeText }}
                  <span v-if="selectedEmergency.alertNo">｜关联告警：{{ selectedEmergency.alertNo }}</span>
                </div>
              </div>
              <div class="header-actions">
                <button
                  v-if="selectedEmergency.rawStatus !== 'CLOSED'"
                  class="btn-secondary"
                  @click="openDispatchDialog"
                >
                  {{ selectedEmergency.rawStatus === 'NEW' ? '派发处置' : '更新派发' }}
                </button>
                <button
                  v-if="selectedEmergency.rawStatus !== 'CLOSED'"
                  class="btn-success"
                  @click="closeSelectedEmergency"
                >
                  关闭事件
                </button>
              </div>
            </div>

            <div class="detail-grid">
              <div class="info-block">
                <div class="block-title">应急信息</div>
                <div class="kv-grid">
                  <div class="kv-item">
                    <label>事件状态</label>
                    <span>{{ selectedEmergency.statusText }}</span>
                  </div>
                  <div class="kv-item">
                    <label>触发用户</label>
                    <span>{{ selectedEmergency.triggerUserId || '--' }}</span>
                  </div>
                  <div class="kv-item">
                    <label>触发设备</label>
                    <span>{{ selectedEmergency.triggerDeviceId || '--' }}</span>
                  </div>
                  <div class="kv-item">
                    <label>初始备注</label>
                    <span>{{ selectedEmergency.remark || '--' }}</span>
                  </div>
                  <div class="kv-item">
                    <label>派发对象</label>
                    <span>{{ selectedEmergency.dispatchAssignee || '--' }}</span>
                  </div>
                  <div class="kv-item">
                    <label>派发班组</label>
                    <span>{{ selectedEmergency.dispatchTeam || '--' }}</span>
                  </div>
                  <div class="kv-item">
                    <label>派发时间</label>
                    <span>{{ formatTime(selectedEmergency.dispatchTime) }}</span>
                  </div>
                  <div class="kv-item">
                    <label>关闭时间</label>
                    <span>{{ formatTime(selectedEmergency.closeTime) }}</span>
                  </div>
                  <div class="kv-item col-span">
                    <label>派发备注</label>
                    <span>{{ selectedEmergency.dispatchRemark || '--' }}</span>
                  </div>
                </div>
              </div>

              <div class="info-block">
                <div class="block-title">关联告警</div>
                <template v-if="linkedAlarm">
                  <div class="kv-grid">
                    <div class="kv-item">
                      <label>告警编号</label>
                      <span>{{ linkedAlarm.alertNo || '--' }}</span>
                    </div>
                    <div class="kv-item">
                      <label>告警状态</label>
                      <span>{{ getAlarmStatusText(linkedAlarm.status) }}</span>
                    </div>
                    <div class="kv-item">
                      <label>告警类型</label>
                      <span>{{ linkedAlarm.alertType || '--' }}</span>
                    </div>
                    <div class="kv-item">
                      <label>发生时间</label>
                      <span>{{ formatTime(linkedAlarm.occurTime) }}</span>
                    </div>
                    <div class="kv-item">
                      <label>确认时间</label>
                      <span>{{ formatTime(linkedAlarm.ackTime) }}</span>
                    </div>
                    <div class="kv-item">
                      <label>关闭时间</label>
                      <span>{{ formatTime(linkedAlarm.closeTime) }}</span>
                    </div>
                  </div>
                  <div class="linked-actions">
                    <button class="btn-text" @click="goToAlarmCenter">前往告警中心查看详情</button>
                  </div>
                </template>
                <div v-else class="empty-inline">暂无关联告警详情</div>
              </div>

              <div class="info-block">
                <div class="block-title">证据概览</div>
                <div v-if="linkedAlarmEvidences.length" class="evidence-list">
                  <div
                    v-for="item in linkedAlarmEvidences"
                    :key="item.id"
                    class="evidence-chip"
                  >
                    <span>{{ getEvidenceTypeText(item.evidenceType) }}</span>
                    <em :class="`status-${String(item.status || '').toLowerCase()}`">{{ getEvidenceStatusText(item.status) }}</em>
                  </div>
                </div>
                <div v-else class="empty-inline">当前尚无证据记录</div>
              </div>

              <div class="info-block timeline-block">
                <div class="block-title">处置时间线</div>
                <div v-if="timelineItems.length" class="timeline">
                  <div
                    v-for="(item, index) in timelineItems"
                    :key="`${item.source}-${item.time || index}-${index}`"
                    class="timeline-item"
                  >
                    <div class="timeline-dot" :class="item.source"></div>
                    <div class="timeline-content">
                      <div class="timeline-title-row">
                        <strong>{{ item.title }}</strong>
                        <span class="timeline-time">{{ formatTime(item.time) }}</span>
                      </div>
                      <div class="timeline-source">{{ item.sourceText }}</div>
                      <div v-if="item.operatorId" class="timeline-remark">操作人：{{ item.operatorId }}</div>
                      <div v-if="item.remark" class="timeline-remark">{{ item.remark }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-inline">暂无处置记录</div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="card-shell empty-detail">
          <i class="el-icon-document"></i>
          <p>请选择左侧一条应急事件</p>
        </div>
      </div>
    </div>

    <el-dialog title="新建应急事件" :visible.sync="createDialogVisible" width="520px">
      <div class="dialog-form">
        <label>触发设备（可选）</label>
        <select v-model="createForm.triggerDeviceId" class="dialog-input">
          <option value="">不指定设备</option>
          <option v-for="item in deviceOptions" :key="item.id" :value="item.id">
            {{ item.deviceCode }}{{ item.deviceName ? ` / ${item.deviceName}` : '' }}
          </option>
        </select>

        <label>事件备注</label>
        <textarea
          v-model.trim="createForm.remark"
          class="dialog-textarea"
          rows="4"
          placeholder="请输入应急事件说明，如：人工演练 / 现场发现异常"
        ></textarea>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateEmergency">确认创建</el-button>
      </span>
    </el-dialog>

    <el-dialog title="派发应急事件" :visible.sync="dispatchDialogVisible" width="520px">
      <div class="dialog-form">
        <label>处理人</label>
        <input v-model.trim="dispatchForm.assignee" class="dialog-input" placeholder="如：张三">

        <label>处理班组</label>
        <input v-model.trim="dispatchForm.team" class="dialog-input" placeholder="如：消防联动组">

        <label>处置备注</label>
        <textarea
          v-model.trim="dispatchForm.remark"
          class="dialog-textarea"
          rows="4"
          placeholder="请输入派发说明、现场要求或注意事项"
        ></textarea>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDispatch">确认派发</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getEmergencyList,
  getEmergencyDetail,
  triggerOneClickAlarm,
  dispatchEmergency,
  closeEmergency
} from '@/api/emergency'
import { getDeviceList } from '@/api/device'
import { getAlarmDetail, getAlarmActions, getAlarmEvidences } from '@/api/alarm'

export default {
  name: 'TaskView',
  data () {
    return {
      statusTabs: [
        { label: '全部', value: 'all' },
        { label: '待派发', value: 'NEW' },
        { label: '处理中', value: 'DISPATCHED' },
        { label: '已关闭', value: 'CLOSED' }
      ],
      currentFilter: 'all',
      emergencies: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      statusTotals: {
        pending: 0,
        dispatched: 0,
        closed: 0
      },
      selectedEmergency: null,
      deviceOptions: [],
      linkedAlarm: null,
      linkedAlarmActions: [],
      linkedAlarmEvidences: [],
      listLoading: false,
      detailLoading: false,
      createDialogVisible: false,
      dispatchDialogVisible: false,
      createForm: {
        triggerDeviceId: '',
        remark: ''
      },
      dispatchForm: {
        assignee: '',
        team: '',
        remark: ''
      }
    }
  },
  computed: {
    displayedEmergencies () {
      return this.emergencies
    },
    stats () {
      const pending = this.statusTotals.pending
      const dispatched = this.statusTotals.dispatched
      const closed = this.statusTotals.closed
      return {
        total: pending + dispatched + closed,
        pending,
        dispatched,
        closed
      }
    },
    timelineItems () {
      const items = []
      if (this.selectedEmergency) {
        items.push({
          source: 'emergency',
          sourceText: '应急事件',
          title: '应急事件创建',
          time: this.selectedEmergency.triggerTime,
          remark: this.selectedEmergency.remark
        })
        if (this.selectedEmergency.dispatchTime) {
          items.push({
            source: 'emergency',
            sourceText: '应急事件',
            title: '应急事件派发',
            time: this.selectedEmergency.dispatchTime,
            remark: this.selectedEmergency.dispatchRemark,
            operatorId: this.selectedEmergency.dispatchBy
          })
        }
        if (this.selectedEmergency.closeTime) {
          items.push({
            source: 'emergency',
            sourceText: '应急事件',
            title: '应急事件关闭',
            time: this.selectedEmergency.closeTime,
            remark: this.selectedEmergency.closeRemark
          })
        }
      }
      this.linkedAlarmActions.forEach(item => {
        items.push({
          source: 'alarm',
          sourceText: '关联告警',
          title: item.actionText || item.action || '告警操作',
          time: item.actionTime || item.createdAt,
          remark: item.remark,
          operatorId: item.operatorId
        })
      })
      return items.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    }
  },
  created () {
    this.fetchDevices()
    this.fetchEmergencies()
  },
  methods: {
    formatTime (value) {
      return value ? String(value).replace('T', ' ') : '--'
    },
    getEmergencyStatusText (status) {
      return {
        NEW: '待派发',
        DISPATCHED: '处理中',
        CLOSED: '已关闭'
      }[String(status || '').toUpperCase()] || (status || '未知')
    },
    getEmergencyStatusClass (status) {
      const raw = String(status || '').toUpperCase()
      if (raw === 'NEW') return 'status-new'
      if (raw === 'DISPATCHED') return 'status-dispatched'
      if (raw === 'CLOSED') return 'status-closed'
      return 'status-unknown'
    },
    getAlarmStatusText (status) {
      return {
        NEW: '未处理',
        ACKED: '处理中',
        PROCESSING: '处理中',
        CLOSED: '已关闭',
        RESOLVED: '已关闭'
      }[String(status || '').toUpperCase()] || (status || '未知')
    },
    getEvidenceTypeText (type) {
      return {
        CLIP: '视频证据',
        SNAPSHOT: '图片证据'
      }[String(type || '').toUpperCase()] || (type || '证据')
    },
    getEvidenceStatusText (status) {
      return {
        SUCCESS: '已生成',
        PROCESSING: '生成中',
        FAILED: '失败',
        EXPIRED: '已过期'
      }[String(status || '').toUpperCase()] || (status || '未知')
    },
    parseDetail (detailJson, fallback) {
      if (fallback && typeof fallback === 'object') return fallback
      try {
        return detailJson ? JSON.parse(detailJson) : {}
      } catch (e) {
        return {}
      }
    },
    normalizeEmergency (item) {
      const detail = this.parseDetail(item.detailJson, item.detail)
      const rawStatus = String(item.status || 'NEW').toUpperCase()
      return {
        ...item,
        detail,
        rawStatus,
        statusText: this.getEmergencyStatusText(rawStatus),
        statusClass: this.getEmergencyStatusClass(rawStatus),
        remark: detail.remark || '',
        closeRemark: detail.closeRemark || '',
        triggerTimeText: this.formatTime(item.triggerTime || item.createdAt)
      }
    },
    async fetchDevices () {
      try {
        const res = await getDeviceList(1, 100)
        this.deviceOptions = (res.data && res.data.list) || []
      } catch (error) {
        this.deviceOptions = []
      }
    },
    async fetchEmergencies () {
      this.listLoading = true
      try {
        const currentId = this.selectedEmergency && this.selectedEmergency.id
        const status = this.currentFilter === 'all' ? '' : this.currentFilter
        const [res] = await Promise.all([
          getEmergencyList({
            page: this.currentPage,
            size: this.pageSize,
            status
          }),
          this.fetchEmergencyTotals()
        ])
        const list = (res.data && res.data.list) || []
        this.emergencies = list.map(item => this.normalizeEmergency(item))
        this.total = Number((res.data && res.data.total) || 0)

        if (!this.emergencies.length && this.currentPage > 1 && this.total >= 0) {
          const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize))
          if (this.currentPage > maxPage) {
            this.currentPage = maxPage
            await this.fetchEmergencies()
            return
          }
        }

        const next = this.emergencies.find(item => item.id === currentId) || this.displayedEmergencies[0] || this.emergencies[0] || null
        if (next) {
          await this.selectEmergency(next)
        } else {
          this.selectedEmergency = null
          this.linkedAlarm = null
          this.linkedAlarmActions = []
          this.linkedAlarmEvidences = []
        }
      } catch (error) {
        this.$message.error(error || '获取应急事件列表失败')
      } finally {
        this.listLoading = false
      }
    },
    async fetchEmergencyTotals () {
      const [pendingRes, dispatchedRes, closedRes] = await Promise.allSettled([
        getEmergencyList({ page: 1, size: 1, status: 'NEW' }),
        getEmergencyList({ page: 1, size: 1, status: 'DISPATCHED' }),
        getEmergencyList({ page: 1, size: 1, status: 'CLOSED' })
      ])
      this.statusTotals = {
        pending: pendingRes.status === 'fulfilled' ? Number((pendingRes.value.data && pendingRes.value.data.total) || 0) : 0,
        dispatched: dispatchedRes.status === 'fulfilled' ? Number((dispatchedRes.value.data && dispatchedRes.value.data.total) || 0) : 0,
        closed: closedRes.status === 'fulfilled' ? Number((closedRes.value.data && closedRes.value.data.total) || 0) : 0
      }
    },
    changeFilter (value) {
      if (this.currentFilter === value) return
      this.currentFilter = value
      this.currentPage = 1
      this.fetchEmergencies()
    },
    handlePageChange (page) {
      if (page === this.currentPage) return
      this.currentPage = page
      this.fetchEmergencies()
    },
    handlePageSizeChange (size) {
      if (size === this.pageSize) return
      this.pageSize = size
      this.currentPage = 1
      this.fetchEmergencies()
    },
    async selectEmergency (item) {
      if (!item || !item.id) return
      this.detailLoading = true
      try {
        const res = await getEmergencyDetail(item.id)
        this.selectedEmergency = this.normalizeEmergency(res.data || item)
        await this.loadLinkedAlarm(this.selectedEmergency.alertId)
      } catch (error) {
        this.$message.error(error || '获取应急事件详情失败')
      } finally {
        this.detailLoading = false
      }
    },
    async loadLinkedAlarm (alertId) {
      this.linkedAlarm = null
      this.linkedAlarmActions = []
      this.linkedAlarmEvidences = []
      if (!alertId) return

      const [alarmDetailRes, actionRes, evidenceRes] = await Promise.allSettled([
        getAlarmDetail(alertId),
        getAlarmActions(alertId),
        getAlarmEvidences(alertId)
      ])

      if (alarmDetailRes.status === 'fulfilled') {
        this.linkedAlarm = alarmDetailRes.value.data || null
      }
      if (actionRes.status === 'fulfilled') {
        this.linkedAlarmActions = Array.isArray(actionRes.value.data) ? actionRes.value.data : []
      }
      if (evidenceRes.status === 'fulfilled') {
        this.linkedAlarmEvidences = Array.isArray(evidenceRes.value.data) ? evidenceRes.value.data : []
      }
    },
    openCreateDialog () {
      this.createDialogVisible = true
      this.createForm = {
        triggerDeviceId: '',
        remark: ''
      }
    },
    async submitCreateEmergency () {
      if (!this.createForm.remark) {
        this.$message.warning('请填写事件备注')
        return
      }
      try {
        const payload = {
          triggerDeviceId: this.createForm.triggerDeviceId ? Number(this.createForm.triggerDeviceId) : null,
          remark: this.createForm.remark
        }
        const res = await triggerOneClickAlarm(payload)
        this.$message.success('应急事件已创建')
        this.createDialogVisible = false
        await this.fetchEmergencies()
        if (res.data && res.data.emergencyId) {
          const target = this.emergencies.find(item => item.id === res.data.emergencyId)
          if (target) {
            await this.selectEmergency(target)
          }
        }
      } catch (error) {
        this.$message.error(error || '创建应急事件失败')
      }
    },
    openDispatchDialog () {
      if (!this.selectedEmergency) return
      this.dispatchForm = {
        assignee: this.selectedEmergency.dispatchAssignee || '',
        team: this.selectedEmergency.dispatchTeam || '',
        remark: this.selectedEmergency.dispatchRemark || ''
      }
      this.dispatchDialogVisible = true
    },
    async submitDispatch () {
      if (!this.selectedEmergency) return
      try {
        await dispatchEmergency(this.selectedEmergency.id, { ...this.dispatchForm })
        this.$message.success('应急事件已派发')
        this.dispatchDialogVisible = false
        await this.fetchEmergencies()
      } catch (error) {
        this.$message.error(error || '派发应急事件失败')
      }
    },
    closeSelectedEmergency () {
      if (!this.selectedEmergency) return
      this.$prompt('请输入关闭备注（可选）', '关闭应急事件', {
        confirmButtonText: '确认关闭',
        cancelButtonText: '取消',
        inputValue: '现场处置完成，事件闭环'
      }).then(async ({ value }) => {
        try {
          await closeEmergency(this.selectedEmergency.id, { remark: value || '现场处置完成，事件闭环' })
          this.$message.success('应急事件已关闭')
          await this.fetchEmergencies()
        } catch (error) {
          this.$message.error(error || '关闭应急事件失败')
        }
      }).catch(() => {})
    },
    goToAlarmCenter () {
      this.$router.push('/alarm').catch(() => {})
    }
  }
}
</script>

<style scoped>
.emergency-view {
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-primary,
.btn-secondary,
.btn-success {
  border: none;
  cursor: pointer;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  transition: 0.2s ease;
}

.btn-primary {
  color: #fff;
  background: #3b82f6;
}

.btn-primary:hover { background: #2563eb; }

.btn-secondary {
  color: #1e3a5f;
  background: #e8f1ff;
}

.btn-secondary:hover { background: #d9e8ff; }

.btn-success {
  color: #fff;
  background: #10b981;
}

.btn-success:hover { background: #059669; }

.btn-text {
  padding: 0;
  border: none;
  background: transparent;
  color: #3b82f6;
  cursor: pointer;
  font-weight: 700;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 18px 20px;
}

.stat-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.stat-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.text-red { color: #ef4444; }
.text-orange { color: #f97316; }
.text-green { color: #10b981; }

.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  min-height: 0;
}

.left-panel,
.detail-card,
.empty-detail {
  min-height: 0;
}

.left-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 18px 18px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  font-size: 16px;
  font-weight: 800;
  color: rgb(16, 46, 87);
}

.filter-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 999px;
  background: #e9eef5;
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.filter-btn.active {
  background: #3b82f6;
  color: #fff;
}

.event-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.list-pagination {
  padding: 0 12px 12px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #e2e8f0;
  background: #f5f9ff;
}

.event-card {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  margin-bottom: 12px;
  cursor: pointer;
  transition: 0.2s ease;
}

.event-card:hover,
.event-card.active {
  border-color: #93c5fd;
  background: #eff6ff;
}

.event-card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.event-no {
  font-size: 14px;
  font-weight: 800;
  color: rgb(16, 46, 87);
  font-family: monospace;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-new {
  color: #ef4444;
  background: #fee2e2;
}

.status-dispatched {
  color: #f97316;
  background: #ffedd5;
}

.status-closed {
  color: #059669;
  background: #d1fae5;
}

.status-unknown {
  color: #64748b;
  background: #e2e8f0;
}

.event-desc {
  margin-top: 10px;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.event-meta {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.right-panel {
  min-height: 0;
}

.detail-card {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title-row h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: rgb(16, 46, 87);
}

.detail-subtitle {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

.detail-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-block {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 16px;
}

.timeline-block {
  grid-column: 1 / -1;
}

.block-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 800;
  color: rgb(16, 46, 87);
}

.kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.kv-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kv-item.col-span {
  grid-column: 1 / -1;
}

.kv-item label {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.kv-item span {
  color: #334155;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.linked-actions {
  margin-top: 12px;
}

.evidence-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.evidence-chip {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.evidence-chip em {
  font-style: normal;
}

.status-success { color: #059669; }
.status-processing { color: #d97706; }
.status-failed { color: #dc2626; }
.status-expired { color: #64748b; }

.timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 7px;
  flex-shrink: 0;
}

.timeline-dot.emergency { background: #3b82f6; }
.timeline-dot.alarm { background: #ef4444; }

.timeline-content {
  flex: 1;
  padding-bottom: 14px;
  border-bottom: 1px dashed #e2e8f0;
}

.timeline-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.timeline-time {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.timeline-source {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.timeline-remark {
  margin-top: 6px;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.empty-state,
.empty-inline,
.empty-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
}

.empty-state {
  min-height: 120px;
}

.empty-inline {
  min-height: 80px;
  font-size: 13px;
}

.empty-detail {
  height: 100%;
  flex-direction: column;
  gap: 14px;
  font-size: 14px;
}

.empty-detail i {
  font-size: 42px;
  color: #cbd5e1;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-form label {
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.dialog-input,
.dialog-textarea {
  width: 100%;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 10px 12px;
  font-size: 14px;
  color: #334155;
  background: #fff;
}

.dialog-textarea {
  resize: vertical;
  min-height: 96px;
}
</style>
