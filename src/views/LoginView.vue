<template>
  <div class="login-container">
    <div ref="containerRef" class="canvas-bg-container">
      <canvas ref="canvasRef" style="display: block;"></canvas>
    </div>

    <div class="bg-decor">
      <div class="hud-corner top-left">SYS_RDY</div>
      <div class="hud-corner bottom-right">SEC_ON</div>
    </div>

    <div class="login-content">
      <div class="illustration-side">
        <div class="tech-pattern"></div>
        <div class="vertical-rail">
          <span class="rail-text">FIRE GUARD AI</span>
          <div class="rail-line"></div>
        </div>

        <div class="illustration-container">
          <div class="iso-grid"></div>
          <div class="rotating-ring"></div>
          <div class="rotating-ring-delayed"></div>
          <div class="car-platform">
            <div class="platform-glow"></div>
            <div class="car-unit main-car">
              <svg viewBox="0 0 500 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <g stroke="var(--accent-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
                  <path d="M 78 278 L 248 363 L 428 273 L 258 188" stroke-dasharray="0 0" opacity="0.8" />
                  <path d="M 80 270 L 250 355 L 430 265 L 260 180 Z" fill="rgba(56, 189, 248, 0.05)" opacity="1" />
                  <g stroke-width="1.5" opacity="0.8">
                    <line x1="320" y1="230" x2="360" y2="250" />
                    <line x1="332" y1="224" x2="372" y2="244" />
                    <line x1="344" y1="218" x2="384" y2="238" />
                    <line x1="356" y1="212" x2="396" y2="232" />
                    <line x1="368" y1="206" x2="408" y2="226" />
                    <line x1="380" y1="200" x2="420" y2="220" />
                  </g>
                  <g transform="translate(90, 245)" opacity="0.9">
                    <ellipse cx="15" cy="25" rx="15" ry="7" />
                    <path d="M 8 23 L 15 5 L 22 23" />
                  </g>
                  <g stroke-linejoin="round">
                    <path d="M 150 280 L 210 310 L 210 275 L 150 245 Z" fill="rgba(15, 23, 42, 0.9)" />
                    <path d="M 150 245 L 210 275 L 234 263 L 174 233 Z" fill="rgba(2, 6, 23, 0.9)" />
                    <path d="M 174 233 L 234 263 L 246 222 L 186 192 Z" fill="rgba(15, 23, 42, 0.9)" />
                    <path d="M 186 192 L 246 222 L 330 180 L 270 150 Z" fill="rgba(2, 6, 23, 0.9)" />
                    <path d="M 210 310 L 210 275 L 234 263 L 246 222 L 330 180 L 330 250 Z" fill="rgba(15, 23, 42, 0.9)" />
                    <path d="M 182 230 L 226 252 L 235 225 L 191 203 Z" fill="rgba(56, 189, 248, 0.1)" stroke="var(--accent-blue)" stroke-width="1.5" />
                    <path d="M 216 273 L 232 265 L 241 235 L 225 243 Z" fill="rgba(56, 189, 248, 0.1)" stroke="var(--accent-blue)" stroke-width="1.5" />
                    <g stroke-width="1.5">
                      <line x1="260" y1="235" x2="310" y2="210" />
                      <line x1="260" y1="225" x2="310" y2="200" />
                      <line x1="265" y1="232" x2="265" y2="222" />
                      <line x1="273" y1="228" x2="273" y2="218" />
                      <line x1="281" y1="224" x2="281" y2="214" />
                      <line x1="289" y1="220" x2="289" y2="210" />
                      <line x1="297" y1="216" x2="297" y2="206" />
                      <line x1="305" y1="212" x2="305" y2="202" />
                    </g>
                    <g stroke-width="2">
                      <ellipse cx="240" cy="295" rx="10" ry="18" transform="rotate(-26.5 240 295)" fill="#020617" />
                      <ellipse cx="240" cy="295" rx="4" ry="7" transform="rotate(-26.5 240 295)" fill="var(--accent-blue)" opacity="0.8"/>
                      <ellipse cx="300" cy="265" rx="10" ry="18" transform="rotate(-26.5 300 265)" fill="#020617" />
                      <ellipse cx="300" cy="265" rx="4" ry="7" transform="rotate(-26.5 300 265)" fill="var(--accent-blue)" opacity="0.8"/>
                    </g>
                  </g>
                </g>
                <path d="M 188 253 C 188 245, 200 245, 200 253 Z" fill="var(--accent-orange)" stroke="none" opacity="0.8"/>
                <ellipse cx="194" cy="253" rx="7" ry="2" stroke="var(--accent-orange)" stroke-width="1.5" fill="none" />
                <path
                  d="M 150 260 L 150 249 Q 150 245, 154 243 L 170 235 Q 174 233, 176 229 L 184 195 Q 186 191, 191 189 L 265 152 Q 270 150, 275 152 L 325 177 Q 330 180, 330 185 L 330 245 Q 330 250, 326 252 L 313 258 Q 300 245, 288 271 L 253 288 Q 240 275, 228 301 L 213 308 Q 210 310, 205 307 L 155 282 Q 150 280, 150 275 Z"
                  stroke="var(--accent-orange)" stroke-width="1.5" stroke-linejoin="round" fill="none" opacity="1"
                />
              </svg>
            </div>
          </div>
          <div class="car-scanner"></div>
          <div class="hud-markers">
            <div class="marker m1"><span class="status-dot"></span> GPS_LOCK</div>
            <div class="marker m2"><span class="status-dot"></span> SCAN_ACTIVE</div>
            <div class="marker m3"><span class="status-dot"></span> AI_CORE_READY</div>
          </div>
        </div>

        <div class="brand-footer">
          <div class="brand-logo-text">
            <div class="logo-group">
              <div class="logo-text-row"><span class="zh">智焰</span><span class="zh-alt">巡防</span></div>
              <span class="en">SMART FLAME PATROL</span>
            </div>
            <div class="logo-sep"></div>
          </div>
        </div>
      </div>

      <div class="login-card">
        <div class="brand-header">
          <h1 class="brand-name">智焰巡防</h1>
          <div class="brand-subtitle">FIREGUARD AI</div>
        </div>

        <div class="form-group">
          <label class="form-label">用户名</label>
          <div class="input-container">
            <i class="el-icon-user input-icon"></i>
            <input v-model="form.username" type="text" class="login-input" placeholder="请输入用户名">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-container">
            <i class="el-icon-lock input-icon"></i>
            <input v-model="form.password" type="password" class="login-input" placeholder="••••••••" @keyup.enter="handleSubmit">
          </div>
        </div>

        <template v-if="!isLogin">
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <div class="input-container">
              <i class="el-icon-lock input-icon"></i>
              <input v-model="form.confirmPassword" type="password" class="login-input" placeholder="请再次输入密码">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <div class="input-container">
              <i class="el-icon-message input-icon"></i>
              <input v-model="form.email" type="email" class="login-input" placeholder="请输入绑定的邮箱">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">验证码</label>
            <div class="input-container">
              <i class="el-icon-key input-icon"></i>
              <input v-model="form.code" type="text" class="login-input" placeholder="验证码" style="padding-right: 110px;" @keyup.enter="handleSubmit">
              <button class="btn-send-code" :disabled="isSending" @click="sendCode">
                {{ isSending ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
        </template>

        <button class="login-button" @click="handleSubmit">
          {{ isLogin ? '系统登录' : '注册账号' }}
        </button>

        <div class="login-footer">
          {{ isLogin ? '尚未分配账号？' : '已拥有操作权限？' }}
          <a href="#" class="footer-link" @click.prevent="toggleMode">{{ isLogin ? '申请注册' : '返回登录' }}</a>
        </div>

        <div class="status-bar">
          <div class="status-item"><span class="status-dot"></span> SECURE CONNECTION</div>
          <div class="status-item">READY • ACTIVE</div>
        </div>
      </div>

    </div>

    <div class="copyright">
      FireGuard AI © 2026 All Rights Reserved
    </div>
  </div>
</template>

<script>
// ⚠️ 业务逻辑一字未动！完全保留 ⚠️
import { sendEmailCode, registerAccount, login } from '@/api/login'
import { setAuthToken } from '@/utils/request'

export default {
  name: 'LoginView',
  data () {
    return {
      isLogin: true,
      isSending: false,
      countdown: 60,
      timer: null,
      form: {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        code: ''
      },
      // Canvas Background properties
      bgStopped: false,
      bgRaf: null,
      bgRo: null,
      regenDotsFn: null,
      bgDots: []
    }
  },
  mounted () {
    // 组件挂载时初始化星空 Canvas 背景
    this.initCanvasBg()
  },
  beforeDestroy () {
    if (this.timer) clearInterval(this.timer)
    // 清理 Canvas 相关监听和动画帧
    this.bgStopped = true
    if (this.bgRaf) cancelAnimationFrame(this.bgRaf)
    if (this.regenDotsFn) window.removeEventListener('resize', this.regenDotsFn)
    if (this.bgRo) this.bgRo.disconnect()
  },
  methods: {
    // 🌟 原生翻译的 React DottedGlowBackground 核心逻辑 (参数已重调) 🌟
    initCanvasBg () {
      const el = this.$refs.canvasRef
      const container = this.$refs.containerRef
      if (!el || !container) return

      const ctx = el.getContext('2d')
      if (!ctx) return

      this.bgStopped = false
      const dpr = Math.max(1, window.devicePixelRatio || 1)

      const resize = () => {
        const { width, height } = container.getBoundingClientRect()
        el.width = Math.max(1, Math.floor(width * dpr))
        el.height = Math.max(1, Math.floor(height * dpr))
        el.style.width = `${width}px`
        el.style.height = `${height}px`
        ctx.scale(dpr, dpr)
      }

      this.bgRo = new ResizeObserver(resize)
      this.bgRo.observe(container)
      setTimeout(resize, 0)

      // 🌟 核心微调：让星空极其稀疏、极慢呼吸 🌟
      const gap = 40 // 间距调大，变稀疏
      const radius = 1.2 // 保持精致微小
      const speedMin = 0.1 // 呼吸最小速度变慢
      const speedMax = 0.2 // 呼吸最大速度变慢
      const speedScale = 0.4 // 整体时间推移变慢
      const color = 'rgba(255,255,255,0.04)' // 暗星
      const glowColor = 'rgba(56, 189, 248, 0.4)' // 亮星 (accent-blue)
      const opacity = 1

      const regenDots = () => {
        this.bgDots = []
        const { width, height } = container.getBoundingClientRect()
        const cols = Math.ceil(width / gap) + 2
        const rows = Math.ceil(height / gap) + 2
        for (let i = -1; i < cols; i++) {
          for (let j = -1; j < rows; j++) {
            const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5)
            const y = j * gap
            this.bgDots.push({
              x,
              y,
              phase: Math.random() * Math.PI * 2,
              speed: speedMin + Math.random() * (speedMax - speedMin)
            })
          }
        }
      }

      regenDots()
      window.addEventListener('resize', regenDots)
      this.regenDotsFn = regenDots

      const draw = (now) => {
        if (this.bgStopped) return
        const { width, height } = container.getBoundingClientRect()
        ctx.clearRect(0, 0, width, height)
        ctx.globalAlpha = opacity

        const time = (now / 1000) * speedScale

        this.bgDots.forEach((d) => {
          const mod = (time * d.speed + d.phase) % 2
          const lin = mod < 1 ? mod : 2 - mod
          const intensity = 0.1 + 0.9 * (lin * lin)

          ctx.beginPath()
          ctx.arc(d.x, d.y, radius, 0, Math.PI * 2)
          // 只有极高阈值的星才会明显发光，其余微弱
          if (intensity > 0.85) {
            ctx.fillStyle = glowColor
            ctx.shadowColor = glowColor
            ctx.shadowBlur = 8 * (intensity - 0.85) * 4
          } else {
            ctx.fillStyle = color
            ctx.shadowBlur = 0
          }
          ctx.globalAlpha = opacity * (intensity > 0.85 ? 0.9 : 0.15 + intensity * 0.4)
          ctx.fill()
        })

        this.bgRaf = requestAnimationFrame(draw)
      }

      this.bgRaf = requestAnimationFrame(draw)
    },

    // Vue 原本逻辑
    toggleMode () {
      this.isLogin = !this.isLogin
      this.form.password = ''
      this.form.confirmPassword = ''
      this.form.email = ''
      this.form.code = ''
    },

    async sendCode () {
      if (this.isSending) return
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.form.email || !emailRegex.test(this.form.email)) {
        return this.$message.warning('请输入正确的邮箱格式！')
      }

      this.isSending = true

      try {
        await sendEmailCode(this.form.email, 'register')
        this.$message.success('验证码已发送，请前往邮箱查收！')
        this.startCountdown()
      } catch (err) {
        this.isSending = false
        this.$message.error(err || '验证码发送失败')
      }
    },

    startCountdown () {
      this.countdown = 60
      this.timer = setInterval(() => {
        if (this.countdown > 1) {
          this.countdown--
        } else {
          clearInterval(this.timer)
          this.isSending = false
        }
      }, 1000)
    },

    async handleSubmit () {
      if (!this.form.username || !this.form.password) {
        return this.$message.warning('请输入用户名和密码！')
      }

      if (this.isLogin) {
        try {
          const res = await login(this.form.username, this.form.password)
          const data = res.data || res
          setAuthToken(data.token)
          localStorage.setItem('sys_username', data.username)
          localStorage.setItem('sys_role', data.role)

          this.$message.success(`欢迎回来，${data.username}！`)
          this.$router.push('/monitor').catch(() => {})
        } catch (error) {
          // 错误由拦截器处理
        }
      } else {
        if (this.form.password !== this.form.confirmPassword) {
          return this.$message.error('两次输入的密码不一致！')
        }
        if (!this.form.email || !this.form.code) {
          return this.$message.warning('请填写邮箱和验证码！')
        }

        try {
          await registerAccount(
            this.form.username,
            this.form.password,
            this.form.email,
            this.form.code
          )
          this.$message.success('注册成功！系统已录入您的权限，请返回登录。')
          this.toggleMode()
        } catch (err) {
          this.$message.error(err || '注册失败')
        }
      }
    }
  }
}
</script>

<style scoped>
/* ================= CSS 变量定义与全局 ================= */
.login-container {
  --app-bg: #020617; /* 深邃的极夜蓝 */
  --card-bg: rgba(15, 23, 42, 0.6);
  --accent-blue: #38bdf8;
  --accent-orange: #fb923c;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --glass-border: rgba(255, 255, 255, 0.08);
  --font-sans: 'Inter', "Helvetica Neue", Helvetica, Arial, sans-serif;

  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
  color: var(--text-primary);
  font-family: var(--font-sans);
  overflow: hidden;
}

/* 🌟 Canvas 背景容器 🌟 */
.canvas-bg-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* 装饰性背景元素 */
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.scanline {
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--accent-blue), transparent);
  opacity: 0.1;
  position: absolute;
  top: -2px;
  animation: scan 8s linear infinite;
}

@keyframes scan {
  from { top: 0; }
  to { top: 100%; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hud-corner {
  position: absolute;
  padding: 24px;
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.4;
  animation: flicker 4s linear infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.3; }
  52% { opacity: 0.5; }
  54% { opacity: 0.4; }
}

.top-left { top: 0; left: 0; border-top: 1px solid var(--accent-blue); border-left: 1px solid var(--accent-blue); width: 40px; height: 40px; margin: 20px; }
.bottom-right { bottom: 0; right: 0; border-bottom: 1px solid var(--accent-orange); border-right: 1px solid var(--accent-orange); width: 40px; height: 40px; margin: 20px; }

/* 登录主布局 */
.login-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 120px;
  z-index: 10;
  width: 100%;
  max-width: 1300px;
  padding: 0 40px;
}

/* ================= 左侧插画区域 ================= */
.illustration-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tech-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgba(56, 189, 248, 0.05) 1px, transparent 0);
  background-size: 40px 40px;
  opacity: 0.5;
  mask-image: radial-gradient(circle at center, black, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at center, black, transparent 80%);
}

.vertical-rail {
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.rail-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: var(--accent-blue);
  letter-spacing: 4px;
  opacity: 0.4;
}

.rail-line {
  width: 1px;
  height: 120px;
  background: linear-gradient(to bottom, var(--accent-blue), transparent);
}

/* 🌟 插画容器 (已按要求放大) 🌟 */
.illustration-container {
  position: relative;
  width: 560px;
  height: 460px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iso-grid {
  position: absolute;
  top: 150px;
  left: 12%;
  width: 500px;
  height: 340px;
  background-image:
      linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  transform: rotateX(65deg) rotateZ(45deg);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 24px;
}

.car-platform {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.platform-glow {
  position: absolute;
  width: 240px;
  height: 120px;
  background: radial-gradient(ellipse, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
  transform: rotateX(65deg);
  bottom: -20px;
}

/* 🌟 小车容器，包含蓝光网格地板，应用整体上下浮动动画 🌟 */
.car-unit {
  position: relative;
  width: 500px;
  height: 400px;
  /* 6s 一次完整呼吸循环，匀速缓动，无限循环 */
  animation: carFloat 6s ease-in-out infinite;
  border-radius: 150px;
  overflow: hidden;
}

@keyframes carFloat {
  0%, 100% {
    transform: translateY(12px); /* 起点和终点都在偏下的位置 */
  }
  50% {
    transform: translateY(-12px); /* 动画进行到一半时，慢慢升到最高点 */
  }
}

.main-car {
  filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.3));
}

.car-scanner {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 2px;
  height: 40px;
  background: var(--accent-blue);
  box-shadow: 0 0 15px var(--accent-blue);
  transform: translateX(-50%);
  animation: scanLine 2s ease-in-out infinite;
}

@keyframes scanLine {
  0%, 100% { opacity: 0; transform: translateX(-50%) scaleY(0.5); }
  50% { opacity: 1; transform: translateX(-50%) scaleY(1.2); }
}

/* 🌟 同心圆环 (已按要求放大) 🌟 */
.rotating-ring, .rotating-ring-delayed {
  position: absolute;
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-radius: 50%;
  transform: rotateX(65deg);
}

.rotating-ring {
  width: 380px;
  height: 380px;
  border-top: 2px solid var(--accent-blue);
  animation: spin 8s linear infinite;
}

.rotating-ring-delayed {
  width: 430px;
  height: 430px;
  border-bottom: 2px solid var(--accent-orange);
  animation: spin 12s linear reverse infinite;
}

.hud-markers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.marker {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--glass-border);
  padding: 6px 10px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 9px;
  color: var(--accent-blue);
  backdrop-filter: blur(4px);
}

.m1 { top: 20%; right: 15%; }
.m2 { bottom: 25%; left: 10%; }
.m3 { top: 15%; left: 20%; }

.marker span { letter-spacing: 1px; }

/* 品牌底部 */
.brand-footer {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.brand-logo-text {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 🌟 解决四个字分行问题 🌟 */
.logo-text-row {
  display: flex;
  align-items: center;
  white-space: nowrap; /* 强制在一行 */
}

.logo-group .zh {
  font-size: 3rem;
  font-weight: 200;
  color: white;
  letter-spacing: 10px;
}

.logo-group .zh-alt {
  font-size: 3rem;
  font-weight: 600;
  color: var(--accent-blue);
  letter-spacing: 10px;
}

.logo-group .en {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: var(--text-secondary);
  letter-spacing: 4px;
  margin-top: 8px;
  opacity: 0.5;
  white-space: nowrap;
}

.logo-sep {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, transparent, var(--glass-border), transparent);
}

.brand-meta {
  display: flex;
  gap: 48px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.meta-label {
  font-size: 8px;
  color: var(--text-secondary);
  letter-spacing: 1px;
  font-weight: 600;
}

.meta-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: white;
  font-weight: 600;
  opacity: 0.8;
}

/* ================= 右侧登录卡片区域 ================= */
.login-card {
  width: 400px;
  background: var(--card-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 40px;
  padding: 40px;
  box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
}

.brand-header {
  margin-bottom: 36px;
}

.brand-name {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  white-space: nowrap; /* 确保不折行 */
  text-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.brand-subtitle {
  font-size: 0.875rem;
  color: var(--accent-blue);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-top: 6px;
  font-weight: 600;
}

/* 表单样式 */
.form-group {
  margin-bottom: 22px;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: var(--text-secondary);
  opacity: 0.5;
  font-size: 16px;
}

.login-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 14px 16px 14px 44px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.login-input::placeholder {
  color: rgba(148, 163, 184, 0.4);
}

.login-input:focus {
  outline: none;
  border-color: var(--accent-blue);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
}
.login-input:focus + .input-icon, .input-container:focus-within .input-icon {
  color: var(--accent-blue);
  opacity: 1;
}

/* 验证码按钮 */
.btn-send-code {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--accent-blue);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}
.btn-send-code:disabled { color: var(--text-secondary); cursor: not-allowed; }

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #fff 0%, #e2e8f0 100%);
  color: #020617;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 10px;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow:
      0 10px 25px rgba(255, 255, 255, 0.15),
      0 0 20px rgba(56, 189, 248, 0.2);
  background: #ffffff;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.footer-link {
  color: var(--accent-blue);
  text-decoration: none;
  margin-left: 8px;
  font-weight: 600;
}

.footer-link:hover {
  text-decoration: underline;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.status-item {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 8px var(--accent-blue);
}

.copyright {
  position: absolute;
  bottom: 24px;
  width: 100%;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.5;
}

@media (max-width: 1024px) {
  .illustration-side { display: none; }
  .login-content { justify-content: center; }
}
</style>
