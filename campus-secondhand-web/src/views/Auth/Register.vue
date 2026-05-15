<template>
  <div class="register-container">
    <div class="register-box card">
      <div class="register-header">
        <h1>创建账号</h1>
        <p>加入校园二手交易平台</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
        class="register-form"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div class="code-input-group">
            <el-input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              clearable
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button
              @click="sendCode"
              :disabled="countdown > 0"
              class="code-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            @keyup.enter="handleRegister"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'
import { Message, Lock, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { authApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

onBeforeUnmount(() => {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

const registerForm = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6-20 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function sendCode() {
  if (!registerForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }

  try {
    await authApi.sendCode(registerForm.email)
    ElMessage.success('验证码已发送')
    
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer !== null) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }
    }, 1000)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '验证码发送失败，请稍后重试'
    ElMessage.error(errorMessage)
  }
}

async function handleRegister() {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    await userStore.register(registerForm.email, registerForm.password, registerForm.code)
    
    ElMessage.success('注册成功')
    router.push('/')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '注册失败，请检查信息并重试'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6B8E7B 0%, #4A6B5B 100%);
  padding: 24px;
}

.register-box {
  width: 100%;
  max-width: 420px;
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #4A4A4A;
    margin-bottom: 8px;
  }

  p {
    color: #7A7A7A;
  }
}

.register-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #4A4A4A;
  }
}

.code-input-group {
  display: flex;
  gap: 12px;
}

.code-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.register-footer {
  text-align: center;
  color: #7A7A7A;

  a {
    color: #6B8E7B;
    font-weight: 500;
    margin-left: 4px;
  }
}
</style>
