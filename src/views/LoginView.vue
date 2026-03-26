<template>
  <div class="login-page">
    <div class="center-line" />

    <div class="mask left-mask">
      <div class="inner left-inner">
        <div class="truck-container">
          <svg
            viewBox="0 0 500 400"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            class="truck-svg"
          >
            <g
              id="base-lines"
              stroke="#5A8BBE"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            >
              <path
                d="M 78 278 L 248 363 L 428 273 L 258 188"
                stroke-dasharray="0 0"
                opacity="0.4"
              />
              <path
                id="ground-plane"
                d="M 80 270 L 250 355 L 430 265 L 260 180 Z"
                opacity="0.8"
                fill="rgba(5, 25, 55, 0.4)"
              />
              <g stroke-width="2">
                <line x1="320" y1="230" x2="360" y2="250" />
                <line x1="332" y1="224" x2="372" y2="244" />
                <line x1="344" y1="218" x2="384" y2="238" />
                <line x1="356" y1="212" x2="396" y2="232" />
                <line x1="368" y1="206" x2="408" y2="226" />
                <line x1="380" y1="200" x2="420" y2="220" />
              </g>

              <polyline
                points="120,225 100,215 100,185 130,170 130,125"
                marker-end="url(#arrowhead)"
              />
              <g transform="translate(90, 245)">
                <ellipse cx="15" cy="25" rx="15" ry="7" />
                <path d="M 8 23 L 15 5 L 22 23" />
              </g>

              <g id="truck-body" stroke-linejoin="round">
                <path d="M 150 280 L 210 310 L 210 275 L 150 245 Z" fill="rgba(15, 40, 80, 0.9)" />
                <path d="M 150 245 L 210 275 L 234 263 L 174 233 Z" fill="rgba(5, 20, 45, 0.9)" />
                <path d="M 174 233 L 234 263 L 246 222 L 186 192 Z" fill="rgba(15, 40, 80, 0.9)" />
                <path d="M 186 192 L 246 222 L 330 180 L 270 150 Z" fill="rgba(5, 20, 45, 0.9)" />
                <path d="M 210 310 L 210 275 L 234 263 L 246 222 L 330 180 L 330 250 Z" fill="rgba(10, 30, 60, 0.9)" />
                <path d="M 182 230 L 226 252 L 235 225 L 191 203 Z" fill="#1b4985" stroke="#5A8BBE" stroke-width="1.5" />
                <path d="M 216 273 L 232 265 L 241 235 L 225 243 Z" fill="#1b4985" stroke="#5A8BBE" stroke-width="1.5" />
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
                  <ellipse cx="240" cy="295" rx="10" ry="18" transform="rotate(-26.5 240 295)" fill="#051937" />
                  <ellipse cx="240" cy="295" rx="4" ry="7" transform="rotate(-26.5 240 295)" />
                  <ellipse cx="300" cy="265" rx="10" ry="18" transform="rotate(-26.5 300 265)" fill="#051937" />
                  <ellipse cx="300" cy="265" rx="4" ry="7" transform="rotate(-26.5 300 265)" />
                </g>
              </g>
            </g>

            <path d="M 188 253 C 188 245, 200 245, 200 253 Z" fill="#FF8C00" stroke="none" />
            <ellipse cx="194" cy="253" rx="7" ry="2" stroke="#5A8BBE" stroke-width="1.5" fill="none" />

            <g stroke="#5A8BBE" stroke-width="1.5">
              <line x1="215" y1="110" x2="215" y2="170" stroke-dasharray="6 6" />
              <line x1="235" y1="120" x2="235" y2="180" stroke-dasharray="6 6" />
              <line x1="255" y1="110" x2="255" y2="150" stroke-dasharray="6 6" />
              <path d="M 235 70 L 255 80 L 235 90 L 215 80 Z" fill="#4a6b8c" stroke="none" />
              <path d="M 215 80 L 215 110 L 235 120 L 235 90 Z" fill="#2a4b6c" stroke="none" />
              <path d="M 255 80 L 255 110 L 235 120 L 235 90 Z" fill="#1a3b5c" stroke="none" />
            </g>

            <path
              id="core-wrapper"
              d="M 150 260 L 150 249 Q 150 245, 154 243 L 170 235 Q 174 233, 176 229 L 184 195 Q 186 191, 191 189 L 265 152 Q 270 150, 275 152 L 325 177 Q 330 180, 330 185 L 330 245 Q 330 250, 326 252 L 313 258 Q 300 245, 288 271 L 253 288 Q 240 275, 228 301 L 213 308 Q 210 310, 205 307 L 155 282 Q 150 280, 150 275 Z"
              stroke="#FF8C00"
              stroke-width="5"
              stroke-linejoin="round"
              fill="none"
            />

            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <polygon points="0,0 6,3 0,6" fill="#5A8BBE" />
              </marker>
            </defs>
          </svg>
          <div class="light-sweep" />
        </div>
      </div>
    </div>

    <div class="mask right-mask">
      <div class="inner right-inner">
        <div class="login-card-modern">
          <div class="card-header">
            <div class="main-info">
              <h1 class="admin-text">智焰巡防</h1>
            </div>
          </div>

          <div class="form-wrapper">
            <div class="input-container">
              <label>用户名</label>
              <div class="input-box">
                <i class="el-icon-user" />
                <input v-model="form.username" type="text" placeholder="请输入用户名">
              </div>
            </div>

            <div class="input-container">
              <label>密码</label>
              <div class="input-box">
                <i class="el-icon-lock" />
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="••••••••"
                  @keyup.enter="handleSubmit"
                >
              </div>
            </div>

            <template v-if="!isLogin">
              <div class="input-container">
                <label>确认密码</label>
                <div class="input-box">
                  <i class="el-icon-lock" />
                  <input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码">
                </div>
              </div>

              <div class="input-container">
                <label>邮箱</label>
                <div class="input-box">
                  <i class="el-icon-message" />
                  <input v-model="form.email" type="email" placeholder="请输入绑定的邮箱">
                </div>
              </div>

              <div class="input-container">
                <label>验证码</label>
                <div class="input-box">
                  <i class="el-icon-key" />
                  <input
                    v-model="form.code"
                    type="text"
                    placeholder="验证码"
                    @keyup.enter="handleSubmit"
                  >
                  <button class="btn-send-code" :disabled="isSending" @click="sendCode">
                    {{ isSending ? `${countdown}s 后重试` : '获取验证码' }}
                  </button>
                </div>
              </div>
            </template>
          </div>

          <button class="btn-init" @click="handleSubmit">
            {{ isLogin ? '系统登录' : '注册账号' }}
          </button>

          <div class="toggle-text" @click="toggleMode">
            {{ isLogin ? '尚未分配账号？申请注册' : '已拥有操作权限？返回登录' }}
          </div>

          <div class="card-footer">
            <div class="status-left">
              <span>EMERGENCY</span>
              <span class="dot" />
              <span>STATUS</span>
            </div>
            <div class="status-right">
              <span>READY</span>
              <span class="dot" />
              <span>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-copyright">
      FireGuard AI © 2026 All Rights Reserved
    </div>
  </div>
</template>

<script>
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
      }
    }
  },
  beforeDestroy () {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    toggleMode () {
      this.isLogin = !this.isLogin
      this.form.password = ''
      this.form.confirmPassword = ''
      this.form.email = ''
      this.form.code = ''
    },

    async sendCode () {
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
/* ================= 1. 全局与背景 ================= */
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: rgb(3, 35, 78);
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: 0 0;
  overflow: hidden;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

/* ================= 2. 中线切割动画 ================= */
.center-line {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 0;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  animation: drawLine 0.6s ease-in-out forwards;
  z-index: 10;
}

@keyframes drawLine {
  0% { height: 0; opacity: 0; }
  50% { opacity: 1; }
  90% { height: 60%; opacity: 1; }
  100% { height: 60%; opacity: 0; }
}

/* ================= 3. 滑出遮罩层 ================= */
.mask { position: absolute; top: 0; width: 50vw; height: 100vh; overflow: hidden; }
.left-mask { left: 0; }
.right-mask { right: 0; }

.inner { position: absolute; top: 0; width: 50vw; height: 100vh; display: flex; align-items: center; }

.left-inner {
  right: 0;
  justify-content: flex-end;
  padding-right: 5vw;
  transform: translateX(50vw);
  animation: slideOutLeft 1s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.right-inner {
  left: 0;
  justify-content: flex-start;
  padding-left: 5vw;
  transform: translateX(-50vw);
  animation: slideOutRight 1s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes slideOutLeft { 100% { transform: translateX(0); } }
@keyframes slideOutRight { 100% { transform: translateX(0); } }

/* ================= 4. 左侧车体及光效 ================= */
.truck-container { position: relative; width: 500px; height: 400px; overflow: hidden; }
.light-sweep {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 30px;
  height: 200%;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
  box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.4);
  transform: rotate(30deg) translateX(-500px);
  animation: sweepAnim 2s 1.8s ease-in-out forwards;
  pointer-events: none;
  opacity: 0;
}

@keyframes sweepAnim {
  0% { transform: rotate(30deg) translateX(-500px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: rotate(30deg) translateX(800px); opacity: 0; }
}

/* ================= 5. 登录卡片 ================= */
.login-card-modern {
  width: 350px;
  background-color: rgba(23, 52, 92, 0.8);
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  background-attachment: fixed;
  backdrop-filter: blur(10px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 30px 45px 40px 45px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  color: #fff;
}

.card-header { margin-bottom: 20px; }
.admin-text { margin: 0 0 15px 0; font-size: 32px; color: #fff; letter-spacing: 2px; font-weight: bold;}

.form-wrapper { display: flex; flex-direction: column; gap: 16px; }
.input-container label { font-size: 11px; color: #6a8bad; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 10px; }

.input-box {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(28, 57, 95, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.3s;
}

.input-box:focus-within { border-color: rgba(255, 255, 255, 0.3); }
.input-box i { color: #6a8bad; font-size: 18px; }
.input-box input { flex: 1; background: transparent; border: none; color: #fff; font-size: 16px; outline: none; letter-spacing: 1px;}
.input-box input::placeholder { color: #4a6b8c; }

.btn-init {
  margin-top: 40px;
  background: #fff;
  color: rgb(16, 46, 87);
  border: none;
  padding: 18px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 4px;
  cursor: pointer;
  transition: 0.3s;
  text-transform: uppercase;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
}

.btn-init:hover { background: #e0e0e0; transform: translateY(-2px); }

.card-footer {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #4a6b8c;
  font-weight: bold;
  letter-spacing: 1.5px;
}

.card-footer .status-left,
.card-footer .status-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-footer .dot { width: 4px; height: 4px; background: #4a6b8c; border-radius: 50%; }

.footer-copyright {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  letter-spacing: 1px;
  animation: fadeIn 1s 2s forwards;
  opacity: 0;
}

@keyframes fadeIn { 100% { opacity: 1; } }

.toggle-text {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #6a8bad;
  cursor: pointer;
  font-weight: bold;
  letter-spacing: 1px;
  transition: 0.3s;
}

.toggle-text:hover { color: #fff; text-shadow: 0 0 8px rgba(255, 255, 255, 0.5); }

.btn-send-code {
  background: transparent;
  border: none;
  color: #a0c2e5;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: 0.3s;
  white-space: nowrap;
}

.btn-send-code:hover:not(:disabled) { color: #fff; }
.btn-send-code:disabled { color: #4a6b8c; cursor: not-allowed; }
</style>
