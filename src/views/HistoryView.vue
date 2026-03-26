<template>
  <div class="history-view">
    <div class="history-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-document-copy text-blue"></i> 系统历史记录</h2>
        <div class="page-subtitle">当前仅聚合后端真实 AI 事件与应急事件</div>
      </div>
      <button class="btn-primary export-btn" @click="handleExport">
        <i class="el-icon-warning-outline"></i>
        导出暂未开放
      </button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm" class="light-inline-form">
        <el-form-item label="记录类型">
          <el-select v-model="searchForm.recordType" placeholder="全部分类" class="tech-input" style="width: 170px;">
            <el-option label="全部分类" value="ALL"></el-option>
            <el-option label="AI 视觉识别" value="AI"></el-option>
            <el-option label="应急事件" value="EMERGENCY"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="输入编号或关键字" class="tech-input" clearable style="width: 240px;"></el-input>
        </el-form-item>

        <el-form-item>
          <button type="button" class="btn-search" @click="handleSearch"><i class="el-icon-search"></i> 查询</button>
          <button type="button" class="btn-reset" @click="resetSearch"><i class="el-icon-refresh-left"></i> 重置</button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="unifiedList" style="width: 100%" class="light-table" v-loading="loading" empty-text="暂无历史记录">
        <el-table-column label="记录类型" width="160">
          <template slot-scope="scope">
            <span class="type-tag" :class="getTypeColor(scope.row.type)">
              <i :class="getTypeIcon(scope.row.type)"></i> {{ scope.row.typeName }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="recordNo" label="系统编号" width="220" class-name="font-mono font-bold text-blue"></el-table-column>
        <el-table-column prop="time" label="发生时间" width="180" class-name="font-mono"></el-table-column>
        <el-table-column prop="description" label="事件简述" min-width="280" show-overflow-tooltip></el-table-column>

        <el-table-column label="状态" width="120">
          <template slot-scope="scope">
            <span class="status-dot" :class="getUnifiedStatusClass(scope.row.status)"></span>
            {{ getUnifiedStatusText(scope.row.status) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <button class="btn-text" @click="viewUnifiedDetail(scope.row)">
              <i class="el-icon-s-data"></i> 查看
            </button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          @size-change="s => { pageSize = s; fetchUnifiedData() }"
          @current-change="p => { currentPage = p; fetchUnifiedData() }"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </div>

    <el-dialog title="AI 事件详情" :visible.sync="aiDetailVisible" width="850px" center custom-class="tech-dialog">
      <div v-loading="detailLoading" style="min-height: 250px;">
        <div v-if="currentDetail" class="detail-content">
          <div class="media-container" v-if="currentDetail.videoUrl || currentDetail.imageUrl">
            <video v-if="currentDetail.videoUrl" :src="currentDetail.videoUrl" controls autoplay muted loop class="ai-media"></video>
            <img v-else :src="currentDetail.imageUrl" alt="AI 抓拍" class="ai-media">
            <div class="overlay-watermark"><span class="pulse-dot"></span> AI EVENT</div>
          </div>
          <div class="data-grid">
            <div class="data-item"><span class="label">识别单号</span><span class="val font-mono text-blue">{{ currentDetail.eventNo }}</span></div>
            <div class="data-item"><span class="label">置信度</span><span class="val font-mono text-blue">{{ currentDetail.confidence ? (currentDetail.confidence * 100).toFixed(1) : '--' }}%</span></div>
            <div class="data-item"><span class="label">触发时间</span><span class="val font-mono">{{ currentDetail.ts }}</span></div>
            <div class="data-item"><span class="label">来源车辆</span><span class="val">{{ currentDetail.vehicleCode || `ID-${currentDetail.vehicleDeviceId}` }}</span></div>
            <div class="data-item col-full">
              <span class="label">原始数据</span>
              <div class="json-box font-mono">{{ currentDetail.rawJson || '无附加原始数据' }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="应急事件详情" :visible.sync="emDetailVisible" width="650px" center custom-class="tech-dialog">
      <div v-loading="detailLoading" style="min-height: 220px;">
        <div v-if="currentDetail" class="detail-content">
          <div class="info-card">
            <div class="detail-row"><span class="label">事件编号:</span> <span class="val font-mono text-red">{{ currentDetail.emergencyNo }}</span></div>
            <div class="detail-row"><span class="label">触发时间:</span> <span class="val font-mono">{{ currentDetail.triggerTime }}</span></div>
            <div class="detail-row"><span class="label">当前状态:</span> <span class="val font-bold">{{ getUnifiedStatusText(currentDetail.status) }}</span></div>
            <div class="detail-row col">
              <span class="label">现场详细参数:</span>
              <div class="parsed-param-box" v-if="currentDetail.parsedDetail && Object.keys(currentDetail.parsedDetail).length > 0">
                <div class="param-item" v-for="(val, key) in currentDetail.parsedDetail" :key="key">
                  <span class="p-key">{{ key }}</span><span class="p-val">{{ val }}</span>
                </div>
              </div>
              <div class="val text-gray" v-else>无详细附加参数</div>
            </div>
          </div>
          <div class="info-card" v-if="currentDetail.dispatchTime">
            <el-divider content-position="left">处置记录</el-divider>
            <div class="detail-row"><span class="label">派发时间:</span> <span class="val font-mono">{{ currentDetail.dispatchTime }}</span></div>
            <div class="detail-row"><span class="label">处理团队:</span> <span class="val">{{ currentDetail.dispatchTeam || '--' }} / {{ currentDetail.dispatchAssignee || '--' }}</span></div>
            <div class="detail-row"><span class="label">处理备注:</span> <span class="val">{{ currentDetail.dispatchRemark || '--' }}</span></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getAiEventList, getAiEventDetail } from '@/api/ai'
import { getEmergencyList, getEmergencyDetail } from '@/api/emergency'

export default {
  name: 'AuditHistoryView',
  data () {
    return {
      loading: false,
      searchForm: { recordType: 'ALL', keyword: '' },
      unifiedList: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      detailLoading: false,
      aiDetailVisible: false,
      emDetailVisible: false,
      currentDetail: null,
      autoOpenedRouteKey: ''
    }
  },
  mounted () {
    this.fetchUnifiedData()
  },
  methods: {
    async fetchUnifiedData () {
      this.loading = true
      let mergedList = []
      try {
        const routeAiEventIds = this.getRouteAiEventIds()
        const onlyAiGroup = routeAiEventIds.length > 0
        if (this.searchForm.recordType === 'AI' || this.searchForm.recordType === 'ALL') {
          try {
            const aiRes = await getAiEventList({ page: 1, size: 50 })
            const aiData = aiRes.data?.list || []
            aiData
              .filter(item => !routeAiEventIds.length || routeAiEventIds.includes(Number(item.id)))
              .forEach(item => {
                mergedList.push({
                  type: 'AI',
                  typeName: 'AI 视觉识别',
                  recordNo: item.eventNo || `AI-${item.id}`,
                  time: (item.ts || item.createdAt || '').replace('T', ' '),
                  sortTime: item.ts || item.createdAt || '',
                  description: `模型判定为 [${this.getDetectText(item.detectType)}]，置信度 ${item.confidence ? (item.confidence * 100).toFixed(0) : '--'}%`,
                  status: item.status,
                  raw: item
                })
              })
          } catch (e) {
            console.error('AI 列表拉取失败', e)
          }
        }

        if (!onlyAiGroup && (this.searchForm.recordType === 'ALL' || this.searchForm.recordType === 'EMERGENCY')) {
          try {
            const emRes = await getEmergencyList({ page: 1, size: 50 })
            const emData = emRes.data?.list || []
            emData.forEach(item => {
              mergedList.push({
                type: 'EMERGENCY',
                typeName: '应急事件',
                recordNo: item.emergencyNo || `EMG-${item.id}`,
                time: (item.triggerTime || item.createdAt || '').replace('T', ' '),
                sortTime: item.triggerTime || item.createdAt || '',
                description: `设备 ${item.triggerDeviceId || '未知'} 触发紧急联动，关联告警 ${item.alertNo || '无'}`,
                status: item.status,
                raw: item
              })
            })
          } catch (e) {
            console.error('应急列表拉取失败', e)
          }
        }

        mergedList.sort((a, b) => {
          const timeA = new Date((a.sortTime || a.time).replace(' ', 'T')).getTime() || 0
          const timeB = new Date((b.sortTime || b.time).replace(' ', 'T')).getTime() || 0
          return timeB - timeA
        })

        if (this.searchForm.keyword) {
          const kw = this.searchForm.keyword.toLowerCase()
          mergedList = mergedList.filter(item =>
            String(item.recordNo || '').toLowerCase().includes(kw) ||
            String(item.description || '').toLowerCase().includes(kw)
          )
        }

        this.total = mergedList.length
        const start = (this.currentPage - 1) * this.pageSize
        this.unifiedList = mergedList.slice(start, start + this.pageSize)
        this.tryOpenRouteDetail()
      } catch (error) {
        this.$message.error(error || '历史记录加载失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch () {
      this.currentPage = 1
      this.fetchUnifiedData()
    },
    resetSearch () {
      this.searchForm = { recordType: 'ALL', keyword: '' }
      this.currentPage = 1
      this.fetchUnifiedData()
    },
    getRouteDetailTarget () {
      const query = (this.$route && this.$route.query) || {}
      const routeAiEventIds = this.getRouteAiEventIds()
      if (routeAiEventIds.length) {
        return { type: 'AI', id: routeAiEventIds[0], key: `AI_GROUP:${routeAiEventIds.join(',')}` }
      }
      const aiEventId = Number(query.aiEventId)
      if (Number.isFinite(aiEventId) && aiEventId > 0) {
        return { type: 'AI', id: aiEventId, key: `AI:${aiEventId}` }
      }
      const emergencyId = Number(query.emergencyId)
      if (Number.isFinite(emergencyId) && emergencyId > 0) {
        return { type: 'EMERGENCY', id: emergencyId, key: `EMERGENCY:${emergencyId}` }
      }
      return null
    },
    getRouteAiEventIds () {
      const raw = this.$route && this.$route.query ? this.$route.query.aiEventIds : ''
      return String(raw || '')
        .split(',')
        .map(item => Number(String(item).trim()))
        .filter(id => Number.isFinite(id) && id > 0)
    },
    tryOpenRouteDetail () {
      const target = this.getRouteDetailTarget()
      if (!target || target.key === this.autoOpenedRouteKey) return
      this.autoOpenedRouteKey = target.key
      this.viewUnifiedDetail({
        type: target.type,
        raw: { id: target.id }
      })
    },
    viewUnifiedDetail (row) {
      this.currentDetail = null
      this.detailLoading = true
      if (row.type === 'AI') {
        this.aiDetailVisible = true
        this.fetchDetailData(getAiEventDetail, row)
      } else if (row.type === 'EMERGENCY') {
        this.emDetailVisible = true
        this.fetchDetailData(getEmergencyDetail, row, true)
      }
    },
    async fetchDetailData (apiFunc, row, needParseJson = false) {
      try {
        const res = await apiFunc(row.raw.id)
        const detail = res.data && !res.data.list ? res.data : row.raw
        Object.keys(detail).forEach(key => {
          if (typeof detail[key] === 'string' && detail[key].includes('T')) {
            detail[key] = detail[key].replace('T', ' ')
          }
        })
        if (needParseJson) {
          try {
            detail.parsedDetail = JSON.parse(detail.detailJson || '{}')
          } catch (e) {
            detail.parsedDetail = {}
          }
        }
        this.currentDetail = detail
      } catch (error) {
        this.$message.warning('无法获取最新详情，展示列表缓存数据')
        const fallback = JSON.parse(JSON.stringify(row.raw))
        if (needParseJson) {
          try {
            fallback.parsedDetail = JSON.parse(fallback.detailJson || '{}')
          } catch (e) {
            fallback.parsedDetail = {}
          }
        }
        this.currentDetail = fallback
      } finally {
        this.detailLoading = false
      }
    },
    getTypeColor (type) {
      return { AI: 'tag-ai', EMERGENCY: 'tag-em' }[type] || 'tag-ai'
    },
    getTypeIcon (type) {
      return { AI: 'el-icon-video-camera-solid', EMERGENCY: 'el-icon-warning' }[type] || 'el-icon-document-copy'
    },
    getDetectText (type) {
      const map = { smoke: '烟雾检测', fire: '明火检测', person: '人员闯入', vehicle: '车辆违停', smoke_high: '高浓度烟雾' }
      return map[type] || type || '目标检测'
    },
    getUnifiedStatusClass (status) {
      const st = (status || '').toUpperCase()
      if (['NEW', 'FAILED', 'ERROR'].includes(st)) return 'status-red'
      if (['CLOSED', 'COMPLETED', 'PROCESSED', 'SUCCESS', 'ARCHIVED'].includes(st)) return 'status-green'
      if (['DISPATCHED', 'RUNNING', 'ACTIVE', 'PROCESSING'].includes(st)) return 'status-blue'
      return 'status-gray'
    },
    getUnifiedStatusText (status) {
      const map = {
        NEW: '新触发',
        PROCESSING: '处理中',
        DISPATCHED: '已派发',
        CLOSED: '已关闭',
        ARCHIVED: '已归档',
        SUCCESS: '已完成'
      }
      return map[(status || '').toUpperCase()] || status || '未知'
    },
    handleExport () {
      this.$message.info('当前版本未接入后端导出接口')
    }
  }
}
</script>

<style scoped>
.history-view { display: flex; flex-direction: column; gap: 24px; height: 100%; box-sizing: border-box; }
.history-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border: 1px solid #e2e8f0; background: #F5F9FF; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }
.header-left { display: flex; flex-direction: column; gap: 6px; }
.page-title { margin: 0; font-size: 20px; color: rgb(16, 46, 87); font-weight: 900; display: flex; align-items: center; gap: 8px; }
.page-subtitle { font-size: 12px; color: #94a3b8; font-weight: bold; }
.text-blue { color: #3b82f6 !important; }
.btn-primary { background-color: rgb(16, 46, 87); color: #F5F9FF; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.filter-bar { padding: 24px 24px 4px 24px; border: 1px solid #e2e8f0; background: #F5F9FF; border-radius: 12px; }
.btn-search { background: #3b82f6; border: none; color: #F5F9FF; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-right: 12px; }
.btn-search:hover { background: #2563eb; }
.btn-reset { background: #F5F9FF; border: 1px solid #cbd5e1; color: #475569; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
.table-container { flex: 1; padding: 24px; border: 1px solid #e2e8f0; background: #F5F9FF; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.font-mono { font-family: monospace; font-weight: bold; }
.text-red { color: #ef4444; }
.text-gray { color: #64748b; }
.type-tag { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid transparent; display: inline-block; }
.tag-ai { color: #8b5cf6; background: #eef2ff; border-color: #ddd6fe; }
.tag-em { color: #ef4444; background: #fef2f2; border-color: #fecaca; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.status-red { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
.status-green { background: #10b981; }
.status-blue { background: #3b82f6; }
.status-gray { background: #94a3b8; }
.btn-text { background: transparent; border: none; color: #3b82f6; cursor: pointer; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 4px; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.detail-content { display: flex; flex-direction: column; gap: 20px; }
.media-container { width: 100%; height: 300px; background: #000; border-radius: 12px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.ai-media { width: 100%; height: 100%; object-fit: contain; }
.overlay-watermark { position: absolute; bottom: 12px; left: 12px; display: flex; align-items: center; gap: 6px; font-family: monospace; font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.8); background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 4px; }
.pulse-dot { width: 6px; height: 6px; background: #00d2ff; border-radius: 50%; box-shadow: 0 0 8px #00d2ff; }
.data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
.data-item { display: flex; flex-direction: column; gap: 6px; }
.data-item.col-full { grid-column: 1 / -1; }
.data-item .label, .detail-row .label { font-size: 12px; color: #64748b; font-weight: bold; }
.data-item .val, .detail-row .val { font-size: 14px; color: #334155; font-weight: bold; line-height: 1.4; }
.json-box { background: #1e293b; color: #a5b4fc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; line-height: 1.5; max-height: 150px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
.info-card { background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
.detail-row { display: flex; align-items: baseline; gap: 12px; font-size: 14px; }
.detail-row.col { flex-direction: column; gap: 8px; }
.parsed-param-box { display: flex; flex-wrap: wrap; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; }
.param-item { display: flex; align-items: baseline; gap: 8px; background: #ffffff; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; }
.p-key { color: #64748b; font-size: 12px; font-weight: bold; }
.p-val { color: #3b82f6; font-size: 13px; font-family: monospace; font-weight: 900; }
</style>
