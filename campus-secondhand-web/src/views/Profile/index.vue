<template>
  <div class="profile-container">
    <div class="profile-header">
      <el-button icon="ArrowLeft" @click="$router.back()" circle />
      <span>个人中心</span>
    </div>

    <div class="profile-content">
      <div class="profile-card card">
        <div class="profile-avatar">
          <el-avatar :size="100" :src="userInfo?.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
        </div>
        <div class="profile-info">
          <h2>{{ userInfo?.nickname }}</h2>
          <p class="email">{{ userInfo?.email }}</p>
          <p class="student-id" v-if="userInfo?.student_id">
            学号: {{ userInfo.student_id }}
          </p>
        </div>
      </div>

      <div class="profile-menu">
        <div class="menu-item" @click="$router.push('/my-goods')">
          <div class="menu-icon">
            <el-icon><Goods /></el-icon>
          </div>
          <span>我的商品</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="$router.push('/favorites')">
          <div class="menu-icon">
            <el-icon><Star /></el-icon>
          </div>
          <span>我的收藏</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="$router.push('/my-messages')">
          <div class="menu-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <span>我的留言</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="profile-settings">
        <div class="settings-section card">
          <h3>账户设置</h3>
          <div class="settings-item">
            <span>昵称</span>
            <el-input v-model="editForm.nickname" placeholder="请输入昵称" style="width: 200px" />
          </div>
          <div class="settings-item">
            <span>微信</span>
            <el-input v-model="editForm.contact_wechat" placeholder="请输入微信号" style="width: 200px" />
          </div>
          <div class="settings-item">
            <span>电话</span>
            <el-input v-model="editForm.contact_phone" placeholder="请输入电话" style="width: 200px" />
          </div>
          <el-button type="primary" @click="saveProfile" :loading="saving">
            保存修改
          </el-button>
        </div>

        <div class="verify-section card">
          <h3>学生认证</h3>
          <div class="verify-status">
            <p v-if="isVerified" class="verified">
              <el-icon><SuccessFilled /></el-icon>
              已认证
            </p>
            <div v-else>
              <p class="unverified">未认证</p>
              <el-button type="primary" @click="showVerifyDialog = true">
                立即认证
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showVerifyDialog" title="学生认证" width="400px">
      <el-form :model="verifyForm" label-position="top">
        <el-form-item label="学号">
          <el-input v-model="verifyForm.student_id" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="verifyForm.student_name" placeholder="请输入姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyDialog = false">取消</el-button>
        <el-button type="primary" @click="verifyStudent" :loading="verifying">
          提交认证
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, User, Goods, Star, ChatDotRound, ArrowRight, SuccessFilled } from '@element-plus/icons-vue'
import { userApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const isVerified = computed(() => !!userInfo.value?.student_id)
const saving = ref(false)
const verifying = ref(false)
const showVerifyDialog = ref(false)

const editForm = reactive({
  nickname: '',
  contact_wechat: '',
  contact_phone: ''
})

const verifyForm = reactive({
  student_id: '',
  student_name: ''
})

function initForm() {
  if (userInfo.value) {
    editForm.nickname = userInfo.value.nickname || ''
    editForm.contact_wechat = userInfo.value.contact_wechat || ''
    editForm.contact_phone = userInfo.value.contact_phone || ''
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await userApi.updateUser({
      nickname: editForm.nickname,
      contact_wechat: editForm.contact_wechat,
      contact_phone: editForm.contact_phone
    })
    await userStore.fetchUserInfo()
    ElMessage.success('保存成功')
  } finally {
    saving.value = false
  }
}

async function verifyStudent() {
  if (!verifyForm.student_id || !verifyForm.student_name) {
    ElMessage.warning('请填写完整信息')
    return
  }

  verifying.value = true
  try {
    await userApi.verifyStudent({
      student_id: verifyForm.student_id,
      student_name: verifyForm.student_name
    })
    await userStore.fetchUserInfo()
    showVerifyDialog.value = false
    ElMessage.success('认证成功')
  } finally {
    verifying.value = false
  }
}

onMounted(() => {
  initForm()
})
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  background: #F8F8F6;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  font-size: 18px;
  font-weight: 500;
}

.profile-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 32px;
  text-align: center;
  margin-bottom: 16px;
}

.profile-avatar {
  margin-bottom: 16px;
}

.profile-info {
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #4A4A4A;
    margin-bottom: 8px;
  }

  .email {
    color: #7A7A7A;
    margin-bottom: 4px;
  }

  .student-id {
    color: #6B8E7B;
    font-weight: 500;
  }
}

.profile-menu {
  margin-bottom: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  cursor: pointer;
  transition: background 0.2s ease;

  &:first-child {
    border-radius: 12px 12px 0 0;
  }

  &:last-child {
    border-radius: 0 0 12px 12px;
  }

  &:hover {
    background: #E8EDE9;
  }
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #E8EDE9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #6B8E7B;
}

.menu-arrow {
  margin-left: auto;
  color: #A0A0A0;
}

.profile-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-section {
  padding: 24px;

  h3 {
    margin-bottom: 16px;
    color: #4A4A4A;
  }
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  span {
    width: 80px;
    flex-shrink: 0;
    color: #4A4A4A;
    font-weight: 500;
  }
}

.verify-section {
  padding: 24px;

  h3 {
    margin-bottom: 16px;
    color: #4A4A4A;
  }
}

.verify-status {
  .verified {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6B8E7B;
    font-weight: 500;
  }

  .unverified {
    color: #C4A76B;
    margin-bottom: 12px;
  }
}
</style>
