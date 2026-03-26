import { Client } from '@stomp/stompjs'

function resolveWsBaseUrl () {
  const configured = (process.env.VUE_APP_WS_BASE_URL || '').trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }
  return 'ws://127.0.0.1'
}

class WebSocketManager {
  constructor (endpoint) {
    this.client = null
    this.endpoint = endpoint
    this.connected = false
    this.connecting = false
    this.subscriptions = {}
    this.connectCallbacks = []
    this.disconnectTimer = null
  }

  connect (onConnectCallback) {
    if (onConnectCallback) {
      this.connectCallbacks.push(onConnectCallback)
    }

    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer)
      this.disconnectTimer = null
    }

    if (this.client && this.connected) {
      this.flushConnectCallbacks()
      return
    }
    if (this.client && this.connecting) return

    const token = localStorage.getItem('sys_token') || ''
    const wsUrl = `${resolveWsBaseUrl()}${this.endpoint}`
    this.connecting = true

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    })

    this.client.onConnect = () => {
      this.connected = true
      this.connecting = false
      console.log(`[WebSocket] ????? ${this.endpoint}`)
      this.restoreSubscriptions()
      this.flushConnectCallbacks()
    }

    this.client.onStompError = (frame) => {
      console.error('[WebSocket] ????:', frame.headers.message)
    }

    this.client.onWebSocketClose = () => {
      this.connected = false
      this.connecting = false
      Object.keys(this.subscriptions).forEach(topic => {
        if (this.subscriptions[topic]) {
          this.subscriptions[topic].sub = null
        }
      })
      console.warn(`[WebSocket] ?????: ${this.endpoint}`)
    }

    this.client.activate()
  }

  subscribe (topic, callback) {
    if (!topic || typeof callback !== 'function') return null
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer)
      this.disconnectTimer = null
    }
    this.subscriptions[topic] = {
      callback,
      sub: this.subscriptions[topic] ? this.subscriptions[topic].sub : null
    }
    if (!this.client) {
      this.connect()
      return null
    }
    if (!this.connected) {
      return null
    }
    return this.subscribeInternal(topic)
  }

  subscribeInternal (topic) {
    const item = this.subscriptions[topic]
    if (!this.client || !this.connected || !item || typeof item.callback !== 'function') {
      return null
    }
    if (item.sub) {
      try {
        item.sub.unsubscribe()
      } catch (e) {}
      item.sub = null
    }
    const sub = this.client.subscribe(topic, (message) => {
      if (!message.body) return
      try {
        item.callback(JSON.parse(message.body))
      } catch (error) {
        console.error('[WebSocket] parse message failed:', error)
      }
    })
    item.sub = sub
    return sub
  }

  unsubscribe (topic) {
    const item = this.subscriptions[topic]
    if (item && item.sub) {
      try {
        item.sub.unsubscribe()
      } catch (e) {}
    }
    if (this.subscriptions[topic]) {
      delete this.subscriptions[topic]
      console.log(`[WebSocket] ??? ${topic}`)
    }
    this.scheduleDisconnectIfIdle()
  }

  restoreSubscriptions () {
    Object.keys(this.subscriptions).forEach(topic => {
      this.subscribeInternal(topic)
    })
  }

  flushConnectCallbacks () {
    const callbacks = this.connectCallbacks.slice()
    this.connectCallbacks = []
    callbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('[WebSocket] onConnect callback failed:', error)
      }
    })
  }

  scheduleDisconnectIfIdle () {
    if (Object.keys(this.subscriptions).length > 0) return
    if (!this.client) return
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer)
    }
    this.disconnectTimer = setTimeout(() => {
      this.disconnectTimer = null
      if (Object.keys(this.subscriptions).length > 0) return
      this.disconnect()
    }, 2000)
  }

  disconnect () {
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (e) {}
    }
    this.client = null
    this.connected = false
    this.connecting = false
    this.connectCallbacks = []
  }
}

export const sensorWs = new WebSocketManager('/ws/sensor')
export const alertWs = new WebSocketManager('/ws/alerts')
