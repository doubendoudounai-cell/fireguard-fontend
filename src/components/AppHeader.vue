<template>
  <header class="app-header">
    <div class="search-wrapper">
      <i class="el-icon-search"></i>
      <input type="text" placeholder="搜索设备、告警或记录（暂未启用）" class="search-input" disabled>
    </div>
    <div class="header-actions">
      <div class="icon-btn alarm-bell" @click="triggerAlarm" title="触发全场紧急报警">
        <i class="el-icon-bell"></i>
      </div>

      <div class="user-profile" title="个人中心" @click="goToSetting">
        <div class="user-text">
          <span class="role-name">{{ username }}</span>
          <span class="role-sub">{{ role }}</span>
        </div>
        <div class="avatar-circle">
          <i class="el-icon-user"></i>
        </div>
      </div>

      <div class="icon-btn logout-btn" @click="handleLogout" title="退出系统">
        <i class="el-icon-switch-button"></i>
      </div>
    </div>
  </header>
</template>

<script>
import { triggerOneClickAlarm } from '@/api/emergency'
import { logout } from '@/api/login'
import { clearAuthToken } from '@/utils/request'

export default {
  name: 'AppHeader',
  data () {
    return {
      username: localStorage.getItem('sys_username') || '管理员',
      role: (localStorage.getItem('sys_role') || 'ADMIN').toUpperCase()
    }
  },
  methods: {
    triggerAlarm () {
      this.$prompt('确定要触发全场紧急报警吗？请输入备注。', '紧急报警确认', {
        confirmButtonText: '立即触发',
        cancelButtonText: '取消',
        inputPlaceholder: '如：人工测试 / 发现火情',
        inputPattern: /\S+/,
        inputErrorMessage: '备注不能为空',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }).then(async ({ value }) => {
        try {
          await triggerOneClickAlarm({ remark: value })
          this.$message.success('紧急报警已触发')
          if (this.$route.path !== '/task') {
            this.$router.push('/task').catch(() => {})
          }
        } catch (error) {
          this.$message.error(error || '报警触发失败')
        }
      }).catch(() => {})
    },
    goToSetting () {
      if (this.$route.path !== '/setting') {
        this.$router.push('/setting').catch(() => {})
      }
    },
    handleLogout () {
      this.$confirm('确定要退出当前系统吗？', '退出确认', {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.performLogout()
      }).catch(() => {})
    },
    async performLogout () {
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
.app-header {
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  background-color: #F0F4F8;
  border-bottom: 1px solid #e2e8f0;
}
.search-wrapper {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  width: 350px;
  border: 1px solid transparent;
}
.search-wrapper i { color: #94a3b8; margin-right: 10px; }
.search-input {
  background: transparent;
  border: none;
  color: #334155;
  outline: none;
  width: 100%;
  font-size: 14px;
}
.search-input:disabled { color: #94a3b8; cursor: not-allowed; }
.header-actions { display: flex; align-items: center; gap: 20px; }
.icon-btn {
  width: 38px;
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: 0.2s;
  cursor: pointer;
  font-size: 20px;
}
.alarm-bell {
  color: #ef4444;
  background-color: #fef2f2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}
.alarm-bell:hover {
  background-color: #ef4444;
  color: #fff;
  transform: translateY(-1px);
}
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding-left: 12px;
  padding-right: 12px;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
}
.user-text { display: flex; flex-direction: column; text-align: right; }
.role-name { font-size: 14px; color: rgb(16, 46, 87); font-weight: bold; }
.role-sub { font-size: 10px; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px; }
.avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #f6faff;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #3b82f6;
  font-size: 18px;
}
.logout-btn { color: #64748b; background-color: transparent; font-size: 22px; }
.logout-btn:hover { background-color: #fef2f2; color: #ef4444; }
</style>
