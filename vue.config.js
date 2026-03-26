const { defineConfig } = require('@vue/cli-service')

const backendTarget = process.env.VUE_APP_DEV_PROXY_TARGET || 'http://47.109.137.34'

module.exports = defineConfig({
  transpileDependencies: true,
  parallel: false,
  devServer: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/ws': {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      },
      '/zlm': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  }
})
