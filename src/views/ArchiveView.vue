<template>
  <div class="archive-view-light">
    <div class="page-header">
      <div>
        <h2 class="page-title">地图档案</h2>
        <div class="page-subtitle">支持上传 SLAM 地图图片与 YAML，切换当前地图并维护风险点</div>
      </div>
      <div class="header-actions">
        <el-input v-model.trim="garageCode" size="small" class="garage-input" placeholder="车库编码，如 g01"></el-input>
        <el-button size="small" @click="fetchMapVersions">刷新</el-button>
        <el-button type="primary" size="small" @click="openUploadDialog">上传地图</el-button>
      </div>
    </div>

    <div class="main-layout">
      <div class="map-panel clean-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">地图版本</div>
            <div class="sub-text">车库：{{ garageCode || '--' }} / 共 {{ mapVersions.length }} 个版本</div>
          </div>
        </div>
        <div v-if="loading" class="empty-box">正在加载地图版本...</div>
        <div v-else-if="mapVersions.length === 0" class="empty-box">当前没有地图版本，请先上传</div>
        <div v-else class="map-list">
          <div
            v-for="map in mapVersions"
            :key="`${map.mapId}-${map.mapVersion}`"
            class="map-item"
            :class="{ active: isSelectedMap(map) }"
            @click="selectMap(map)"
          >
            <div class="map-icon">
              <i class="el-icon-map-location"></i>
            </div>
            <div class="map-info">
              <h4>{{ map.mapVersion }}</h4>
              <p>mapId: {{ map.mapId }}</p>
              <p>分辨率: {{ map.resolution || '--' }} / 尺寸: {{ map.width || '--' }} × {{ map.height || '--' }}</p>
            </div>
            <div class="map-action">
              <span v-if="map.current" class="status-tag normal">当前生效</span>
              <button v-else class="btn-outline" @click.stop="handleActivateMap(map)">设为当前</button>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-panel">
        <div class="preview-card clean-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">地图预览</div>
              <div class="sub-text" v-if="selectedMap">{{ selectedMap.mapId }} / {{ selectedMap.mapVersion }}</div>
            </div>
            <div v-if="selectedMap" class="preview-actions">
              <a v-if="selectedMap.yamlUrl" :href="selectedMap.yamlUrl" target="_blank" rel="noopener" class="btn-link">下载 YAML</a>
            </div>
          </div>
          <div class="map-preview-box">
            <template v-if="selectedMap && selectedMap.imageUrl">
              <img :src="selectedMap.imageUrl" class="preview-img" alt="地图预览">
              <button
                v-for="point in mappableRiskPoints"
                :key="point.pointCode"
                type="button"
                class="risk-preview-marker"
                :class="{ selected: selectedRiskPoint && selectedRiskPoint.pointCode === point.pointCode }"
                :style="buildPreviewMarkerStyle(point)"
                :title="`${point.pointName || point.pointCode}｜${getRiskTypeName(point.pointType)}｜${point.x}, ${point.y}`"
                @click.stop="selectRiskPoint(point)"
              >
                <span class="marker-dot"></span>
                <span class="marker-label">{{ point.pointName || point.pointCode }}</span>
              </button>
            </template>
            <div v-else class="empty-text">当前地图没有可预览图片，可重新上传 PNG/JPG/PGM</div>
            <div v-if="selectedMap" class="map-version-tag">{{ selectedMap.mapVersion }}</div>
          </div>
          <div v-if="selectedRiskPoint" class="selected-risk-summary">
            <div class="summary-title">{{ selectedRiskPoint.pointName || selectedRiskPoint.pointCode }}</div>
            <div class="summary-text">
              {{ getRiskTypeName(selectedRiskPoint.pointType) }} ｜ 坐标 {{ selectedRiskPoint.x }}, {{ selectedRiskPoint.y }}
            </div>
          </div>
          <div v-if="selectedMap" class="map-meta-grid">
            <div class="meta-item"><span>地图 ID</span><strong>{{ selectedMap.mapId }}</strong></div>
            <div class="meta-item"><span>版本</span><strong>{{ selectedMap.mapVersion }}</strong></div>
            <div class="meta-item"><span>分辨率</span><strong>{{ selectedMap.resolution || '--' }}</strong></div>
            <div class="meta-item"><span>原点</span><strong>{{ formatOrigin(selectedMap) }}</strong></div>
            <div class="meta-item"><span>宽度</span><strong>{{ selectedMap.width || '--' }}</strong></div>
            <div class="meta-item"><span>高度</span><strong>{{ selectedMap.height || '--' }}</strong></div>
          </div>
        </div>

        <div class="risk-card clean-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">风险点</div>
              <div class="sub-text">只操作当前选中地图版本</div>
            </div>
            <button class="btn-secondary" @click="openRiskDialog('add')" :disabled="!selectedMap">
              <i class="el-icon-plus"></i> 新增风险点
            </button>
          </div>
          <div class="table-container">
            <el-table
              ref="riskTable"
              :data="riskPoints"
              stripe
              highlight-current-row
              style="width: 100%"
              empty-text="当前地图暂无风险点"
              @row-click="selectRiskPoint"
            >
              <el-table-column prop="pointCode" label="风险点编号" width="140"></el-table-column>
              <el-table-column prop="pointName" label="风险点名称" min-width="160"></el-table-column>
              <el-table-column prop="pointType" label="风险类型" width="140">
                <template slot-scope="scope">
                  <span class="type-tag" :class="scope.row.pointType">{{ getRiskTypeName(scope.row.pointType) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="坐标 (X, Y)" width="180">
                <template slot-scope="scope">
                  {{ scope.row.x }}, {{ scope.row.y }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="openRiskDialog('edit', scope.row)">编辑</el-button>
                  <el-button type="text" size="small" class="text-danger" @click="handleDeleteRiskPoint(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <el-dialog title="上传地图" :visible.sync="showUploadDialog" width="640px" center append-to-body>
      <el-form :model="uploadForm" label-width="110px">
        <el-form-item label="地图 ID">
          <el-input v-model.trim="uploadForm.mapId" placeholder="如 slam-g01"></el-input>
        </el-form-item>
        <el-form-item label="地图版本">
          <el-input v-model.trim="uploadForm.mapVersion" placeholder="如 2026-03-25-v1"></el-input>
        </el-form-item>
        <el-form-item label="地图图片">
          <input class="file-input" type="file" accept=".png,.jpg,.jpeg,.bmp,.svg,.pgm" @change="onUploadFileChange($event, 'imageFile')">
          <div class="file-tip">支持 PNG/JPG/BMP/SVG/PGM，PGM 会自动转成 PNG 预览</div>
          <div v-if="uploadForm.imageFile" class="file-name">已选择：{{ uploadForm.imageFile.name }}</div>
        </el-form-item>
        <el-form-item label="YAML 文件">
          <input class="file-input" type="file" accept=".yaml,.yml" @change="onUploadFileChange($event, 'yamlFile')">
          <div class="file-tip">可自动读取 resolution、originX、originY</div>
          <div v-if="uploadForm.yamlFile" class="file-name">已选择：{{ uploadForm.yamlFile.name }}</div>
        </el-form-item>
        <div class="upload-grid">
          <el-form-item label="分辨率">
            <el-input-number v-model="uploadForm.resolution" :precision="4" :step="0.01" :controls="false" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="原点 X">
            <el-input-number v-model="uploadForm.originX" :precision="4" :step="0.1" :controls="false" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="原点 Y">
            <el-input-number v-model="uploadForm.originY" :precision="4" :step="0.1" :controls="false" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="宽度">
            <el-input-number v-model="uploadForm.width" :min="0" :controls="false" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="高度">
            <el-input-number v-model="uploadForm.height" :min="0" :controls="false" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="设为当前">
            <el-switch v-model="uploadForm.current"></el-switch>
          </el-form-item>
        </div>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">上传</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="riskDialogType === 'add' ? '新增风险点' : '编辑风险点'" :visible.sync="showRiskDialog" width="500px" center append-to-body>
      <el-form :model="currentRiskForm" label-width="100px">
        <el-form-item label="点位编号" v-if="riskDialogType === 'add'">
          <el-input v-model="currentRiskForm.pointCode" placeholder="例如：RP-001"></el-input>
        </el-form-item>
        <el-form-item label="点位名称">
          <el-input v-model="currentRiskForm.pointName" placeholder="例如：B2 下坡拐角"></el-input>
        </el-form-item>
        <el-form-item label="风险类型">
          <el-select v-model="currentRiskForm.pointType" placeholder="请选择类型" style="width: 100%">
            <el-option label="视觉盲区" value="blind_spot"></el-option>
            <el-option label="积水区" value="water_ponding"></el-option>
            <el-option label="杂物区" value="clutter"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="X 坐标">
          <el-input-number v-model="currentRiskForm.x" :precision="2" :step="0.1"></el-input-number>
        </el-form-item>
        <el-form-item label="Y 坐标">
          <el-input-number v-model="currentRiskForm.y" :precision="2" :step="0.1"></el-input-number>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showRiskDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRiskPoint">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getMapList, activateMap, uploadMap, getRiskPoints, addRiskPoint, updateRiskPoint, deleteRiskPoint } from '@/api/map'
import { getGarageMap } from '@/api/device'

const createUploadForm = () => ({
  mapId: '',
  mapVersion: '',
  resolution: undefined,
  originX: undefined,
  originY: undefined,
  width: undefined,
  height: undefined,
  current: true,
  imageFile: null,
  yamlFile: null
})

export default {
  name: 'GarageMapManagement',
  data () {
    return {
      garageCode: 'g01',
      loading: false,
      uploading: false,
      mapVersions: [],
      selectedMap: null,
      riskPoints: [],
      selectedRiskPoint: null,
      showUploadDialog: false,
      uploadForm: createUploadForm(),
      showRiskDialog: false,
      riskDialogType: 'add',
      currentRiskForm: { pointCode: '', pointName: '', pointType: '', x: 0, y: 0 }
    }
  },
  computed: {
    mappableRiskPoints () {
      return this.riskPoints.filter(item => this.isRiskPointMappable(item))
    }
  },
  mounted () {
    this.fetchMapVersions()
  },
  methods: {
    async fetchMapVersions (preferredKey) {
      if (!this.garageCode) {
        this.$message.warning('请先输入车库编码')
        return
      }
      this.loading = true
      try {
        const [currentRes, listRes] = await Promise.allSettled([
          getGarageMap(this.garageCode),
          getMapList(this.garageCode)
        ])
        const list = listRes.status === 'fulfilled' ? (listRes.value.data || []) : []
        const currentMap = currentRes.status === 'fulfilled' ? currentRes.value.data : null
        this.mapVersions = list
        this.selectedMap = this.resolveSelectedMap(list, currentMap, preferredKey)
        if (this.selectedMap) {
          await this.fetchRiskPoints(this.selectedMap.mapId, this.selectedMap.mapVersion)
        } else {
          this.riskPoints = []
          this.selectedRiskPoint = null
        }
      } catch (error) {
        this.mapVersions = []
        this.selectedMap = null
        this.riskPoints = []
        this.selectedRiskPoint = null
        this.$message.error(error || `车库 [${this.garageCode}] 地图数据获取失败`)
      } finally {
        this.loading = false
      }
    },
    resolveSelectedMap (list, currentMap, preferredKey) {
      if (preferredKey) {
        const preferred = list.find(item => `${item.mapId}::${item.mapVersion}` === preferredKey)
        if (preferred) return preferred
      }
      if (this.selectedMap) {
        const exists = list.find(item => this.isSelectedMap(item))
        if (exists) return exists
      }
      if (currentMap) {
        return list.find(item => item.mapId === currentMap.mapId && item.mapVersion === currentMap.mapVersion) || currentMap
      }
      return list[0] || null
    },
    isSelectedMap (map) {
      return !!(this.selectedMap && map && this.selectedMap.mapId === map.mapId && this.selectedMap.mapVersion === map.mapVersion)
    },
    selectMap (map) {
      this.selectedMap = map
      this.selectedRiskPoint = null
      this.fetchRiskPoints(map.mapId, map.mapVersion)
    },
    formatOrigin (map) {
      if (!map) return '--'
      return `${map.originX || 0}, ${map.originY || 0}`
    },
    isRiskPointMappable (point) {
      if (!this.selectedMap || !point) return false
      const resolution = Number(this.selectedMap.resolution)
      const width = Number(this.selectedMap.width)
      const height = Number(this.selectedMap.height)
      const x = Number(point.x)
      const y = Number(point.y)
      return Number.isFinite(resolution) && resolution > 0 &&
        Number.isFinite(width) && width > 0 &&
        Number.isFinite(height) && height > 0 &&
        Number.isFinite(x) && Number.isFinite(y)
    },
    buildPreviewMarkerStyle (point) {
      const map = this.selectedMap || {}
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
        top: `${top}%`
      }
    },
    selectRiskPoint (row) {
      if (!row) return
      this.selectedRiskPoint = row
      this.$nextTick(() => {
        if (this.$refs.riskTable && this.$refs.riskTable.setCurrentRow) {
          this.$refs.riskTable.setCurrentRow(row)
        }
      })
    },
    syncSelectedRiskPoint () {
      const currentCode = this.selectedRiskPoint && this.selectedRiskPoint.pointCode
      const matched = currentCode ? (this.riskPoints.find(item => item.pointCode === currentCode) || null) : null
      this.selectedRiskPoint = matched
      this.$nextTick(() => {
        if (this.$refs.riskTable && this.$refs.riskTable.setCurrentRow) {
          this.$refs.riskTable.setCurrentRow(matched)
        }
      })
    },
    openUploadDialog () {
      this.uploadForm = createUploadForm()
      this.showUploadDialog = true
    },
    onUploadFileChange (event, field) {
      const files = event.target && event.target.files
      this.$set(this.uploadForm, field, files && files[0] ? files[0] : null)
    },
    async submitUpload () {
      if (!this.garageCode) return this.$message.warning('请先输入车库编码')
      if (!this.uploadForm.mapId || !this.uploadForm.mapVersion) return this.$message.warning('请填写地图 ID 和地图版本')
      if (!this.uploadForm.imageFile && !this.uploadForm.yamlFile) return this.$message.warning('请至少选择一个地图文件')

      const formData = new FormData()
      formData.append('mapId', this.uploadForm.mapId)
      formData.append('mapVersion', this.uploadForm.mapVersion)
      formData.append('current', this.uploadForm.current ? 'true' : 'false')
      this.appendOptionalField(formData, 'resolution', this.uploadForm.resolution)
      this.appendOptionalField(formData, 'originX', this.uploadForm.originX)
      this.appendOptionalField(formData, 'originY', this.uploadForm.originY)
      this.appendOptionalField(formData, 'width', this.uploadForm.width)
      this.appendOptionalField(formData, 'height', this.uploadForm.height)
      if (this.uploadForm.imageFile) formData.append('imageFile', this.uploadForm.imageFile)
      if (this.uploadForm.yamlFile) formData.append('yamlFile', this.uploadForm.yamlFile)

      this.uploading = true
      try {
        const res = await uploadMap(this.garageCode, formData)
        const uploaded = res.data || {}
        this.$message.success('地图上传成功')
        this.showUploadDialog = false
        await this.fetchMapVersions(`${uploaded.mapId}::${uploaded.mapVersion}`)
      } catch (error) {
        this.$message.error(error || '地图上传失败')
      } finally {
        this.uploading = false
      }
    },
    appendOptionalField (formData, key, value) {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
      }
    },
    handleActivateMap (map) {
      this.$confirm(`确定将 ${map.mapVersion} 设为当前地图吗？`, '切换确认', { type: 'warning' })
        .then(async () => {
          try {
            await activateMap(this.garageCode, map.mapId, map.mapVersion)
            this.$message.success('地图已切换')
            await this.fetchMapVersions(`${map.mapId}::${map.mapVersion}`)
          } catch (error) {
            this.$message.error(error || '切换地图失败')
          }
        }).catch(() => {})
    },
    async fetchRiskPoints (mapId, mapVersion) {
      try {
        const res = await getRiskPoints(this.garageCode, { mapId, mapVersion })
        this.riskPoints = res.data || []
        this.syncSelectedRiskPoint()
      } catch (error) {
        this.riskPoints = []
        this.selectedRiskPoint = null
      }
    },
    getRiskTypeName (type) {
      const map = { blind_spot: '视觉盲区', water_ponding: '积水区', clutter: '杂物区' }
      return map[type] || type || '未知风险'
    },
    openRiskDialog (type, row = null) {
      this.riskDialogType = type
      this.currentRiskForm = type === 'edit' && row
        ? { ...row }
        : { pointCode: '', pointName: '', pointType: '', x: 0, y: 0 }
      if (row) {
        this.selectRiskPoint(row)
      }
      this.showRiskDialog = true
    },
    async saveRiskPoint () {
      if (!this.selectedMap) return this.$message.warning('请先选择地图版本')
      const payload = {
        ...this.currentRiskForm,
        mapId: this.selectedMap.mapId,
        mapVersion: this.selectedMap.mapVersion
      }
      try {
        if (this.riskDialogType === 'add') {
          await addRiskPoint(this.garageCode, payload)
          this.$message.success('新增风险点成功')
        } else {
          await updateRiskPoint(this.garageCode, payload.pointCode, payload)
          this.$message.success('更新风险点成功')
        }
        this.showRiskDialog = false
        await this.fetchRiskPoints(this.selectedMap.mapId, this.selectedMap.mapVersion)
      } catch (error) {
        this.$message.error(error || '保存失败')
      }
    },
    handleDeleteRiskPoint (row) {
      this.$confirm(`确定删除风险点 [${row.pointName}] 吗？`, '删除确认', { type: 'warning' })
        .then(async () => {
          try {
            await deleteRiskPoint(this.garageCode, row.pointCode)
            this.$message.success('删除成功')
            await this.fetchRiskPoints(this.selectedMap.mapId, this.selectedMap.mapVersion)
          } catch (error) {
            this.$message.error(error || '删除失败')
          }
        }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.archive-view-light { display: flex; flex-direction: column; min-height: 100%; box-sizing: border-box; background-color: #F0F4F8; color: #334155; padding: 12px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 16px; }
.page-title { margin: 0; font-size: 24px; font-weight: 900; color: rgb(16, 46, 87); }
.page-subtitle { font-size: 12px; color: #94a3b8; font-weight: bold; letter-spacing: 1px; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.garage-input { width: 150px; }
.clean-card { background: #F5F9FF; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
.panel-header { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; gap: 12px; }
.panel-title { font-size: 16px; font-weight: 800; color: rgb(16, 46, 87); }
.sub-text { font-size: 12px; color: #94a3b8; font-weight: bold; margin-top: 4px; }
.main-layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px; align-items: start; }
.map-panel { overflow: hidden; }
.map-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.map-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.2s ease; }
.map-item:hover { border-color: #cbd5e1; }
.map-item.active { border-color: #93c5fd; background: #eff6ff; }
.map-icon { width: 40px; height: 40px; background: #f1f5f9; color: rgb(16, 46, 87); font-size: 20px; border-radius: 8px; display: flex; justify-content: center; align-items: center; flex-shrink: 0; }
.map-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.map-info h4 { margin: 0; font-size: 15px; color: #334155; font-weight: bold; }
.map-info p { margin: 0; font-size: 12px; color: #94a3b8; font-family: monospace; }
.map-action { display: flex; align-items: center; }
.status-tag { font-size: 12px; border-radius: 10px; padding: 2px 8px; font-weight: bold; }
.status-tag.normal { color: #059669; background: #d1fae5; border: 1px solid #34d399; }
.btn-secondary { background: #fff; color: rgb(16, 46, 87); border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; color: #3b82f6; border: 1px solid #3b82f6; padding: 4px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; }
.btn-link { color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: 700; }
.detail-panel { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.preview-card { min-height: 360px; }
.preview-actions { display: flex; align-items: center; gap: 10px; }
.map-preview-box { flex: 1; min-height: 280px; background: #1e293b; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
.preview-img { width: 100%; height: 100%; object-fit: contain; }
.risk-preview-marker { position: absolute; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: transparent; cursor: pointer; }
.marker-dot { width: 12px; height: 12px; border-radius: 50%; background: #f59e0b; border: 2px solid rgba(255,255,255,0.92); box-shadow: 0 4px 10px rgba(0,0,0,0.18); }
.marker-label { padding: 3px 8px; border-radius: 999px; background: rgba(15,23,42,0.72); color: #fff; font-size: 12px; font-weight: 700; white-space: nowrap; }
.risk-preview-marker.selected .marker-dot { background: #ef4444; box-shadow: 0 0 0 4px rgba(255,255,255,0.28); }
.risk-preview-marker.selected .marker-label { background: #2563eb; }
.empty-text, .empty-box { color: #64748b; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; text-align: center; padding: 24px; }
.map-version-tag { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: #fff; padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: bold; }
.selected-risk-summary { padding: 12px 16px; background: #fff7ed; border-top: 1px solid #fed7aa; border-bottom: 1px solid #ffedd5; }
.summary-title { font-size: 14px; font-weight: 800; color: #9a3412; }
.summary-text { margin-top: 4px; font-size: 12px; color: #7c2d12; font-weight: 700; }
.map-meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 14px 16px 16px; background: #fff; border-top: 1px solid #e2e8f0; }
.meta-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.meta-item span { font-size: 12px; color: #94a3b8; font-weight: 700; }
.meta-item strong { font-size: 13px; color: #334155; word-break: break-all; }
.risk-card { min-height: 320px; }
.table-container { flex: 1; padding: 0 10px 10px 10px; overflow: visible; }
.type-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
.type-tag.blind_spot { background: #fee2e2; color: #ef4444; }
.type-tag.water_ponding { background: #e0f2fe; color: #0ea5e9; }
.type-tag.clutter { background: #fef3c7; color: #d97706; }
.text-danger { color: #ef4444; }
.upload-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 12px; }
.file-input { display: block; width: 100%; }
.file-tip { margin-top: 6px; color: #94a3b8; font-size: 12px; }
.file-name { margin-top: 6px; color: #334155; font-size: 12px; font-weight: 700; }
@media (max-width: 1200px) {
  .main-layout { grid-template-columns: 1fr; }
  .map-meta-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
