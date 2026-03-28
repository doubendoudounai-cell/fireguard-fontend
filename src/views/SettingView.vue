<template>
  <div class="setting-view">
    <div class="setting-header">
      <h2 class="page-title"><i class="el-icon-user text-blue"></i> 个人中心</h2>
    </div>

    <div class="setting-layout">
      <div class="left-col">
        <div class="config-card account-card">
          <div class="card-header"><i class="el-icon-info text-blue"></i> 账号概览</div>
          <div class="account-body">
            <div class="avatar-wrapper">
              <div class="avatar-circle"><i class="el-icon-s-custom"></i></div>
            </div>
            <h3 class="user-name">{{ username }}</h3>
            <p class="user-role">{{ roleDisplay }}</p>
            <div class="info-list">
              <div class="info-item">
                <i class="el-icon-date"></i> 注册时间: <span class="font-mono">--</span>
              </div>
              <div class="info-item">
                <i class="el-icon-key"></i> 账号状态: <span class="status-active">已登录</span>
              </div>
            </div>
            <button class="btn-danger mt-auto" @click="handleLogout">退出当前账号</button>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div class="config-card">
          <div class="card-header"><i class="el-icon-message text-blue"></i> 邮箱绑定设置</div>
          <div class="card-body">
            <div class="security-form">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>新邮箱地址</label>
                  <input v-model="emailForm.email" type="email" placeholder="请输入要绑定的新邮箱" class="tech-input-box">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>邮箱验证码</label>
                  <div class="input-with-btn">
                    <input v-model="emailForm.code" type="text" placeholder="6位验证码" class="tech-input-box">
                    <button class="btn-send-code" :disabled="emailCountdown > 0" @click="handleSendCode('emailForm', 'modify')">
                      {{ emailCountdown > 0 ? `${emailCountdown}s 后重试` : '发送验证码' }}
                    </button>
                  </div>
                </div>
              </div>
              <button class="btn-primary" @click="submitUpdateEmail" :disabled="actionLoading">确认换绑邮箱</button>
            </div>
          </div>
        </div>

        <div class="config-card">
          <div class="card-header"><i class="el-icon-lock text-blue"></i> 密码安全中心</div>
          <div class="card-body password-card-body">
            <el-tabs v-model="pwdActiveTab" class="tech-tabs">
              <el-tab-pane label="验证旧密码修改" name="normal">
                <div class="security-form mt-15">
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>当前密码</label>
                      <input v-model="pwdForm.oldPwd" type="password" placeholder="请输入当前登录密码" class="tech-input-box">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>新密码</label>
                      <input v-model="pwdForm.newPwd" type="password" placeholder="长度 6-20 位字符" class="tech-input-box">
                    </div>
                    <div class="form-group flex-1">
                      <label>确认新密码</label>
                      <input v-model="pwdForm.confirmPwd" type="password" placeholder="请再次输入新密码" class="tech-input-box">
                    </div>
                  </div>
                  <button class="btn-primary" @click="submitUpdatePassword" :disabled="actionLoading">确认修改密码</button>
                </div>
              </el-tab-pane>

              <el-tab-pane label="通过邮箱重置" name="email">
                <div class="security-form mt-15">
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>绑定邮箱</label>
                      <input v-model="resetForm.email" type="email" placeholder="请输入当前绑定邮箱" class="tech-input-box">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>验证码</label>
                      <div class="input-with-btn">
                        <input v-model="resetForm.code" type="text" placeholder="6位验证码" class="tech-input-box">
                        <button class="btn-send-code" :disabled="resetCountdown > 0" @click="handleSendCode('resetForm', 'reset')">
                          {{ resetCountdown > 0 ? `${resetCountdown}s 后重试` : '发送验证码' }}
                        </button>
                      </div>
                    </div>
                    <div class="form-group flex-1">
                      <label>设置新密码</label>
                      <input v-model="resetForm.password" type="password" placeholder="长度 6-20 位字符" class="tech-input-box">
                    </div>
                  </div>
                  <button class="btn-warning" @click="submitResetPassword" :disabled="actionLoading">验证并重置密码</button>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <div v-if="isAdmin" class="config-card danger-card">
          <div class="card-header"><i class="el-icon-delete text-danger-icon"></i> 测试数据清理</div>
          <div class="card-body">
            <div class="danger-tip">
              仅建议在测试环境使用。执行后会清理告警、应急事件、风险点；清理告警时会同时删除关联处理记录、证据记录和证据文件。
            </div>

            <div class="danger-options">
              <label class="option-check">
                <input v-model="cleanupForm.clearAlerts" type="checkbox">
                <span>清理告警</span>
              </label>
              <label class="option-check">
                <input v-model="cleanupForm.clearEmergencyEvents" type="checkbox">
                <span>清理应急事件</span>
              </label>
              <label class="option-check">
                <input v-model="cleanupForm.clearRiskPoints" type="checkbox">
                <span>清理风险点</span>
              </label>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>风险点车库编码（可选）</label>
                <input
                  v-model.trim="cleanupForm.garageCode"
                  type="text"
                  placeholder="为空则清理全部车库风险点，如 g01"
                  class="tech-input-box"
                >
              </div>
            </div>

            <div class="danger-actions">
              <button class="btn-danger-outline" :disabled="cleanupLoading || !cleanupHasSelection" @click="handleCleanupTestData">
                {{ cleanupLoading ? '清理中...' : '一键清理测试数据' }}
              </button>
            </div>

            <div v-if="lastCleanupResult" class="cleanup-result">
              <div class="cleanup-result-title">最近一次清理结果</div>
              <div class="cleanup-grid">
                <div class="cleanup-item">
                  <span>告警</span>
                  <strong>{{ lastCleanupResult.deletedAlerts || 0 }}</strong>
                </div>
                <div class="cleanup-item">
                  <span>告警处理记录</span>
                  <strong>{{ lastCleanupResult.deletedAlertActionLogs || 0 }}</strong>
                </div>
                <div class="cleanup-item">
                  <span>告警证据记录</span>
                  <strong>{{ lastCleanupResult.deletedAlertEvidenceFiles || 0 }}</strong>
                </div>
                <div class="cleanup-item">
                  <span>应急事件</span>
                  <strong>{{ lastCleanupResult.deletedEmergencyEvents || 0 }}</strong>
                </div>
                <div class="cleanup-item">
                  <span>风险点</span>
                  <strong>{{ lastCleanupResult.deletedRiskPoints || 0 }}</strong>
                </div>
                <div class="cleanup-item">
                  <span>证据文件</span>
                  <strong>{{ lastCleanupResult.deletedEvidenceStorageFiles || 0 }}</strong>
                </div>
              </div>
              <div class="cleanup-scope">
                风险点范围：{{ lastCleanupResult.riskPointGarageCode || '全部车库' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { sendEmailCode, updatePassword, updateEmail, resetPasswordByEmail } from '@/api/user'
import { logout } from '@/api/login'
import { cleanupTestData } from '@/api/admin'
import { clearAuthToken } from '@/utils/request'

export default {
  name: 'AccountSettingView',
  data () {
    const storedRole = localStorage.getItem('sys_role') || 'admin'
    return {
      username: localStorage.getItem('sys_username') || '管理员',
      role: storedRole,
      actionLoading: false,
      cleanupLoading: false,
      pwdActiveTab: 'normal',
      emailForm: { email: '', code: '' },
      emailCountdown: 0,
      emailTimer: null,
      pwdForm: { oldPwd: '', newPwd: '', confirmPwd: '' },
      resetForm: { email: '', code: '', password: '' },
      resetCountdown: 0,
      resetTimer: null,
      cleanupForm: {
        clearAlerts: true,
        clearEmergencyEvents: true,
        clearRiskPoints: true,
        garageCode: ''
      },
      lastCleanupResult: null
    }
  },
  computed: {
    isAdmin () {
      return String(this.role || '').toLowerCase() === 'admin'
    },
    roleDisplay () {
      return String(this.role || '').toUpperCase()
    },
    cleanupHasSelection () {
      return this.cleanupForm.clearAlerts || this.cleanupForm.clearEmergencyEvents || this.cleanupForm.clearRiskPoints
    }
  },
  beforeDestroy () {
    if (this.emailTimer) clearInterval(this.emailTimer)
    if (this.resetTimer) clearInterval(this.resetTimer)
  },
  methods: {
    async handleSendCode (formType, typeStr) {
      const targetForm = this[formType]
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!targetForm.email || !emailRegex.test(targetForm.email)) {
        return this.$message.warning('请输入正确格式的邮箱地址')
      }

      try {
        await sendEmailCode(targetForm.email, typeStr)
        this.$message.success('验证码已发送至邮箱，请注意查收')
        if (formType === 'emailForm') {
          this.emailCountdown = 60
          this.emailTimer = setInterval(() => {
            if (this.emailCountdown > 1) this.emailCountdown--
            else {
              clearInterval(this.emailTimer)
              this.emailCountdown = 0
            }
          }, 1000)
        } else {
          this.resetCountdown = 60
          this.resetTimer = setInterval(() => {
            if (this.resetCountdown > 1) this.resetCountdown--
            else {
              clearInterval(this.resetTimer)
              this.resetCountdown = 0
            }
          }, 1000)
        }
      } catch (err) {
        this.$message.error(err || '验证码发送失败')
      }
    },
    async submitUpdateEmail () {
      if (!this.emailForm.email || !this.emailForm.code) {
        return this.$message.warning('请填写新邮箱和验证码')
      }
      this.actionLoading = true
      try {
        await updateEmail({ email: this.emailForm.email, code: this.emailForm.code })
        this.$message.success('邮箱换绑成功')
        this.emailForm = { email: '', code: '' }
      } catch (err) {
        this.$message.error(err || '邮箱换绑失败')
      } finally {
        this.actionLoading = false
      }
    },
    async submitUpdatePassword () {
      const { oldPwd, newPwd, confirmPwd } = this.pwdForm
      if (!oldPwd || !newPwd || !confirmPwd) return this.$message.warning('请填写完整的密码信息')
      if (newPwd.length < 6 || newPwd.length > 20) return this.$message.warning('新密码长度需在 6-20 个字符之间')
      if (newPwd !== confirmPwd) return this.$message.error('两次输入的新密码不一致')

      this.actionLoading = true
      try {
        await updatePassword({ password: oldPwd, new_password: newPwd })
        this.$message.success('密码修改成功，请重新登录')
        setTimeout(() => { this.forceLogout() }, 1200)
      } catch (err) {
        this.$message.error(err || '密码修改失败')
      } finally {
        this.actionLoading = false
      }
    },
    async submitResetPassword () {
      const { email, code, password } = this.resetForm
      if (!email || !code || !password) return this.$message.warning('请填写完整的重置信息')
      if (password.length < 6 || password.length > 20) return this.$message.warning('新密码长度需在 6-20 个字符之间')

      this.actionLoading = true
      try {
        await resetPasswordByEmail({ email, code, password })
        this.$message.success('密码重置成功，请重新登录')
        setTimeout(() => { this.forceLogout() }, 1200)
      } catch (err) {
        this.$message.error(err || '密码重置失败')
      } finally {
        this.actionLoading = false
      }
    },
    async handleCleanupTestData () {
      if (!this.isAdmin) {
        return this.$message.error('仅管理员可执行该操作')
      }
      if (!this.cleanupHasSelection) {
        return this.$message.warning('请至少勾选一项清理内容')
      }

      const summary = [
        this.cleanupForm.clearAlerts ? '告警' : null,
        this.cleanupForm.clearEmergencyEvents ? '应急事件' : null,
        this.cleanupForm.clearRiskPoints
          ? `风险点${this.cleanupForm.garageCode ? `（车库 ${this.cleanupForm.garageCode}）` : '（全部车库）'}`
          : null
      ].filter(Boolean).join('、')

      try {
        await this.$confirm(
          `确认清理以下测试数据：${summary}？该操作不可恢复，请确保当前为测试环境。`,
          '危险操作确认',
          {
            confirmButtonText: '确认清理',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (_) {
        return
      }

      this.cleanupLoading = true
      try {
        const res = await cleanupTestData({
          confirm: true,
          clearAlerts: this.cleanupForm.clearAlerts,
          clearEmergencyEvents: this.cleanupForm.clearEmergencyEvents,
          clearRiskPoints: this.cleanupForm.clearRiskPoints,
          garageCode: this.cleanupForm.garageCode || null
        })
        const data = res.data || {}
        this.lastCleanupResult = data
        this.$message.success(
          `清理完成：告警 ${data.deletedAlerts || 0} 条，应急 ${data.deletedEmergencyEvents || 0} 条，风险点 ${data.deletedRiskPoints || 0} 个`
        )
      } catch (err) {
        this.$message.error(err || '测试数据清理失败')
      } finally {
        this.cleanupLoading = false
      }
    },
    handleLogout () {
      this.$confirm('确定要退出当前账号吗？', '提示', {
        confirmButtonText: '确认退出',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.forceLogout()
      }).catch(() => {})
    },
    async forceLogout () {
      try {
        await logout()
      } catch (error) {
        console.warn('logout request failed, fallback to local logout', error)
      } finally {
        clearAuthToken()
        localStorage.removeItem('sys_username')
        localStorage.removeItem('sys_role')
        this.$router.push('/login').catch(() => {})
        this.$message.success('已安全退出系统')
      }
    }
  }
}
</script>

<style scoped>
.setting-view { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
.setting-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
.page-title { margin: 0; font-size: 24px; font-weight: 900; color: rgb(16, 46, 87); }
.setting-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; overflow-y: auto; padding-right: 10px; }
.left-col, .right-col { display: flex; flex-direction: column; gap: 24px; }
.config-card { background: #F5F9FF; border: 1px solid #eeeeef; border-radius: 16px; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.02); overflow: hidden; }
.card-header { padding: 20px 24px; font-size: 16px; font-weight: 900; color: rgb(16, 46, 87); border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px; background: #F5F9FF; }
.text-blue { color: #3b82f6; font-size: 20px; }
.text-danger-icon { color: #ef4444; font-size: 20px; }
.card-body { padding: 24px; }
.password-card-body { padding-top: 10px; }
.account-card { height: 100%; }
.account-body { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; height: 100%; box-sizing: border-box; }
.avatar-wrapper { margin-bottom: 16px; }
.avatar-circle { width: 100px; height: 100px; border-radius: 50%; border: 4px solid #eff6ff; display: flex; justify-content: center; align-items: center; font-size: 48px; color: #3b82f6; background: #ffffff; }
.user-name { margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: rgb(16, 46, 87); }
.user-role { margin: 0 0 30px 0; font-size: 13px; color: #64748b; font-weight: bold; letter-spacing: 1px; }
.info-list { width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; }
.info-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; font-weight: bold; }
.info-item i { color: #94a3b8; font-size: 16px; }
.font-mono { font-family: monospace; color: #334155; }
.status-active { color: #10b981; background: #d1fae5; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.mt-auto { margin-top: auto; }
.mt-15 { margin-top: 15px; }
.btn-danger { width: 100%; background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; }
.btn-danger:hover { background: #ef4444; color: #fff; }
.security-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; gap: 24px; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 13px; color: #64748b; font-weight: bold; }
.tech-input-box { background: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 14px; width: 100%; box-sizing: border-box; font-weight: bold; }
.tech-input-box:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px #eff6ff; outline: none; }
.input-with-btn { display: flex; gap: 12px; }
.btn-send-code { white-space: nowrap; background: #eff6ff; border: 1px solid #bfdbfe; color: #3b82f6; padding: 0 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-send-code:hover:not(:disabled) { background: #dbeafe; }
.btn-send-code:disabled { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; cursor: not-allowed; }
.btn-primary, .btn-warning { align-self: flex-start; background: rgb(16, 46, 87); color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-primary:hover:not(:disabled), .btn-warning:hover:not(:disabled) { background: rgb(26, 66, 117); }
.btn-primary:disabled, .btn-warning:disabled { opacity: 0.7; cursor: not-allowed; }
.danger-card { border-color: #fecaca; }
.danger-tip { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 10px; padding: 12px 14px; font-size: 13px; line-height: 1.6; margin-bottom: 18px; }
.danger-options { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
.option-check { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #334155; font-size: 13px; font-weight: 700; }
.option-check input { margin: 0; }
.danger-actions { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
.btn-danger-outline { align-self: flex-start; background: #fff; color: #dc2626; border: 1px solid #fca5a5; padding: 12px 22px; border-radius: 8px; font-weight: 800; cursor: pointer; }
.btn-danger-outline:hover:not(:disabled) { background: #dc2626; color: #fff; border-color: #dc2626; }
.btn-danger-outline:disabled { opacity: 0.6; cursor: not-allowed; }
.cleanup-result { margin-top: 18px; padding-top: 18px; border-top: 1px dashed #e2e8f0; }
.cleanup-result-title { font-size: 14px; font-weight: 800; color: rgb(16, 46, 87); margin-bottom: 12px; }
.cleanup-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.cleanup-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.cleanup-item span { font-size: 12px; color: #64748b; font-weight: 700; }
.cleanup-item strong { font-size: 18px; color: #0f172a; }
.cleanup-scope { margin-top: 12px; font-size: 12px; color: #64748b; font-weight: 700; }
::v-deep .tech-tabs .el-tabs__item { font-weight: bold; color: #64748b; font-size: 15px; }
::v-deep .tech-tabs .el-tabs__item.is-active { color: #3b82f6; }
::v-deep .tech-tabs .el-tabs__active-bar { background-color: #3b82f6; height: 3px; border-radius: 3px; }
@media (max-width: 1200px) {
  .cleanup-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
