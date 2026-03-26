import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/LoginView.vue') },
  // 🛑 已经删除了 /dashboard 路由
  // 将 monitor 作为登录后的首要业务页面
  { path: '/monitor', component: () => import('../views/MonitorView.vue'), meta: { requiresAuth: true } },
  { path: '/overview', component: () => import('../views/VehicleOverviewView.vue'), meta: { requiresAuth: true } },
  { path: '/alarm', component: () => import('../views/AlarmView.vue'), meta: { requiresAuth: true } },
  { path: '/task', component: () => import('../views/TaskView.vue'), meta: { requiresAuth: true } },
  { path: '/archive', component: () => import('../views/ArchiveView.vue'), meta: { requiresAuth: true } },
  { path: '/history', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
  { path: '/setting', component: () => import('../views/SettingView.vue'), meta: { requiresAuth: true } }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// 全局路由守卫：检查 Token
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('sys_token')
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 需要鉴权的页面，如果没有 token，踢回登录页
    if (!token) {
      next({ path: '/login' })
    } else {
      next()
    }
  } else {
    // 登录页不需要鉴权，如果已经有 token 还去登录页，直接进系统主页
    if (to.path === '/login' && token) {
      // 🌟 修改点：登录后默认跳转到监控页 (/monitor)
      next({ path: '/monitor' })
    } else {
      next()
    }
  }
})

export default router
