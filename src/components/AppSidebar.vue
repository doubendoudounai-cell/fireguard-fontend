<template>
  <aside class="app-sidebar">
    <div class="logo-area">
      <div class="shield-icon-container">
        <svg viewBox="0 0 24 24" class="custom-shield" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="brand-text">
        <h1 class="main-title">FireGuard</h1>
      </div>
    </div>

    <nav class="nav-menu">
      <div
        v-for="item in menuList"
        :key="item.path"
        class="nav-item"
        :class="{ active: $route.path === item.path }"
        @click="handleNavigate(item.path)"
      >
        <i :class="item.icon"></i>
        <span>{{ item.name }}</span>
      </div>
    </nav>

    <div class="uav-status">
      <div class="status-header">
        <span class="name">系统运行状态</span>
      </div>
      <div class="battery-label">
        <span>前端服务</span>
        <span class="batt-num">ONLINE</span>
      </div>
      <div class="battery-bar-bg">
        <div class="battery-fill" style="width: 100%;"></div>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'AppSidebar',
  data () {
    return {
      menuList: [
        { name: '实时监控', path: '/monitor', icon: 'el-icon-video-camera' },
        { name: '车辆总览', path: '/overview', icon: 'el-icon-s-data' },
        { name: '告警中心', path: '/alarm', icon: 'el-icon-warning-outline' },
        { name: '应急处置', path: '/task', icon: 'el-icon-s-claim' },
        { name: '车库档案', path: '/archive', icon: 'el-icon-files' },
        { name: '历史记录', path: '/history', icon: 'el-icon-time' },
        { name: '系统设置', path: '/setting', icon: 'el-icon-setting' }
      ]
    }
  },
  methods: {
    handleNavigate (targetPath) {
      if (this.$route.path !== targetPath) {
        this.$router.push(targetPath).catch(() => {})
      }
    }
  }
}
</script>

<style scoped>
.app-sidebar {
  width: 260px;
  background-color: rgb(3, 35, 78);
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  box-sizing: border-box;
}
.logo-area { display: flex; align-items: center; margin-bottom: 40px; padding-left: 8px; }
.shield-icon-container {
  background-color: rgb(31, 58, 96);
  width: 44px;
  height: 44px;
  border-radius: 10px;
  margin-right: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.custom-shield { width: 24px; height: 24px; }
.main-title { font-size: 20px; font-weight: 900; margin: 0; color: rgb(248, 248, 248); letter-spacing: 0.5px; }
.nav-menu { flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 8px;
  color: #94a3b8;
  border-radius: 10px;
  transition: 0.2s;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
}
.nav-item:hover { background-color: rgb(19, 45, 82); color: #ffffff; }
.nav-item.active { background-color: rgb(29, 57, 96); color: #ffffff; }
.nav-item.active i { color: #3b82f6; }
.nav-item i { margin-right: 12px; font-size: 18px; }
.uav-status {
  background-color: rgb(29, 57, 96);
  padding: 16px;
  border-radius: 12px;
  margin-top: auto;
  border: 1px solid #28486e;
}
.status-header { display: flex; align-items: center; font-size: 13px; margin-bottom: 12px; color: rgb(112, 130, 154); font-weight: bold; }
.battery-label { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
.battery-label .batt-num { color: rgb(112, 130, 154); font-weight: bold; }
.battery-bar-bg { height: 6px; background-color: #e2e8f0; border-radius: 3px; overflow: hidden; }
.battery-fill { height: 100%; background-color: rgb(36, 138, 61); border-radius: 3px; }
</style>
