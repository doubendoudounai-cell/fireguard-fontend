<template>
  <div id="app" class="fireguard-os">
    <app-sidebar v-if="$route.path !== '/login'" />
    <div class="os-main-wrapper">
      <app-header v-if="$route.path !== '/login'" />
      <main class="os-view-container" :class="{ 'no-padding': $route.path === '/login' }">
        <router-view :key="$route.fullPath" />
      </main>
    </div>
  </div>
</template>

<script>
// 注意：如果你左侧的文件名叫 SideBar.vue，请把这里的路径改成 './components/SideBar.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'

export default {
  name: 'App',
  components: {
    AppSidebar,
    AppHeader
  }
}
</script>

<style>
/* ================= 🌟 极简大气白蓝全局主题系统 ================= */
:root {
  --app-bg: #F0F4F8; /* 全局极简灰蓝大背景 */
  --card-bg: #ffffff; /* 纯白卡片 */
  --primary-grand: rgb(16, 46, 87); /* 藏蓝：用于大标题、强调文字 */
  --primary-action: #3b82f6; /* 亮蓝：用于选中状态、图标点缀 */
  --primary-red: #ef4444; /* 现代亮红：用于告警 */
  --text-main: #334155; /* 主文本色 */
  --text-sub: #94a3b8; /* 次文本色 */
  --border-color: #e2e8f0; /* 极淡的分割线 */
}

html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
  background-color: var(--app-bg) !important;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0 !important;
  padding: 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fireguard-os { display: flex; height: 100vh; width: 100vw; }

/* 🌟 核心修复 1：彻底抛弃 --bg-dark，让主容器变成极简灰蓝 */
.os-main-wrapper {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  background-color: var(--app-bg);
}

.os-view-container {
  flex: 1; padding: 24px; overflow-y: auto;
  background-color: var(--app-bg);
}

.os-view-container.no-padding { padding: 0; }

/* 全局滚动条美化 (浅色版) */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ================= 🌟 Element UI 终极洗白：适配极简白蓝 ================= */

/* 1. 进度条与滑块 */
.el-progress-bar__inner, .el-slider__bar { background-color: var(--primary-action) !important; }

/* 2. 洗白输入框与选择器 (通透浅灰底，聚焦变白) */
.tech-input .el-input__inner,
.el-range-editor.tech-input,
.el-input__inner {
  background-color: #f8fafc !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-main) !important;
  border-radius: 8px !important;
  transition: all 0.3s;
}
.tech-input .el-range-input { background-color: transparent !important; color: var(--text-main) !important; }
.tech-input .el-range-separator, .tech-input .el-range__icon, .tech-input .el-range__close-icon { color: var(--text-sub) !important; }

/* 聚焦时的高亮边框 (使用亮蓝色) */
.tech-input .el-input__inner:focus,
.el-select .el-input__inner:focus,
.el-range-editor.tech-input.is-active,
.el-input__inner:focus {
  background-color: #fff !important;
  border-color: #93c5fd !important;
  box-shadow: 0 0 0 3px #eff6ff !important;
}

/* 3. 洗白所有悬浮面板：下拉框、日期面板、弹层 */
.el-select-dropdown, .el-picker-panel, .el-time-panel, .el-popper {
  background-color: #ffffff !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
  border-radius: 12px !important;
}
.el-popper[x-placement^="bottom"] .popper__arrow::after { border-bottom-color: #ffffff !important; }
.el-popper[x-placement^="bottom"] .popper__arrow { border-bottom-color: var(--border-color) !important; }

/* 下拉选项悬停 (浅蓝底色) */
.el-select-dropdown__item { color: var(--text-main) !important; }
.el-select-dropdown__item.hover, .el-select-dropdown__item:hover {
  background-color: #eff6ff !important;
  color: var(--primary-grand) !important;
}
.el-select-dropdown__item.selected { color: var(--primary-action) !important; font-weight: bold; background-color: #eff6ff !important; }

/* 日期面板洗白 */
.el-picker-panel__body, .el-date-picker__header, .el-picker-panel__icon-btn, .el-date-table th { background-color: #ffffff !important; color: var(--text-main) !important; }
.el-date-table td { color: var(--text-sub) !important; }
.el-date-table td:hover { color: var(--primary-action) !important; }
.el-date-table td.in-range div { background-color: #eff6ff !important; }
.el-date-table td.end-date span, .el-date-table td.start-date span { background-color: var(--primary-action) !important; color: #fff !important; }
.el-picker-panel__footer { background-color: #f8fafc !important; border-top: 1px solid var(--border-color) !important; }

/* 4. 彻底洗白 Dialog 弹窗 */
.el-dialog { background-color: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 16px !important; box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;}
.el-dialog__title { color: var(--primary-grand) !important; font-weight: 900; }
.el-dialog__body { color: var(--text-main) !important; }

/* 5. 彻底洗白 Table 表格 */
.el-table, .el-table__expanded-cell { background-color: transparent !important; color: var(--text-main) !important; }
.el-table th, .el-table tr { background-color: #ffffff !important; color: var(--text-sub) !important; font-weight: bold; border-bottom: 1px solid var(--border-color) !important; }
.el-table td { border-bottom: 1px solid var(--border-color) !important; }
.el-table--enable-row-hover .el-table__body tr:hover > td { background-color: #f8fafc !important; }
.el-table::before { display: none !important; }

/* 6. 洗白分页器 */
.el-pagination button:disabled { background-color: transparent !important; color: #cbd5e1 !important; }
.el-pagination .btn-prev, .el-pagination .btn-next { background-color: transparent !important; color: var(--text-sub) !important; }
.el-pager li { background-color: transparent !important; border: 1px solid var(--border-color); color: var(--text-sub); border-radius: 6px; margin: 0 4px; }
.el-pager li.active { background-color: var(--primary-action) !important; color: #fff !important; border-color: var(--primary-action) !important; }
.el-pagination__total, .el-pagination__jump { color: var(--text-sub) !important; }
</style>
