import Vue from 'vue'
import App from './App.vue'
import router from './router' // 引入我们刚才写的路由配置

// 引入 Element UI (为了显示各种精美的图标和组件)
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
Vue.use(ElementUI) // 注册 Element UI

new Vue({
  router, // 把路由注入到 Vue 实例中，这一步如果没有，页面就是纯黑的！
  render: h => h(App)
}).$mount('#app')
