<template>
  <div class="admin-layout">
    <el-container class="container">
      <el-aside width="240px" class="sidebar">
        <div class="sidebar-header">
          <h2>管理后台</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><DataLine /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-menu-item index="goods">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          <el-menu-item index="users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="messages">
            <el-icon><ChatDotRound /></el-icon>
            <span>留言管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <div class="content-header">
          <h2>{{ pageTitle }}</h2>
          <div class="header-actions">
            <el-button icon="Refresh" @click="refreshData">
              刷新
            </el-button>
            <el-button @click="$router.push('/')">
              返回首页
            </el-button>
          </div>
        </div>

        <div class="content-body">
          <div class="dashboard-section" v-if="activeMenu === 'dashboard'">
            <div class="stats-cards">
              <div class="stat-card card">
                <div class="stat-value">{{ stats.totalUsers }}</div>
                <div class="stat-label">用户总数</div>
              </div>
              <div class="stat-card card">
                <div class="stat-value">{{ stats.totalGoods }}</div>
                <div class="stat-label">商品总数</div>
              </div>
              <div class="stat-card card">
                <div class="stat-value">{{ stats.totalMessages }}</div>
                <div class="stat-label">留言总数</div>
              </div>
              <div class="stat-card card">
                <div class="stat-value">{{ stats.todayNewUsers }}</div>
                <div class="stat-label">今日新增</div>
              </div>
            </div>
          </div>

          <div class="goods-section" v-if="activeMenu === 'goods'">
            <div class="section-toolbar">
              <el-input
                v-model="goodsKeyword"
                placeholder="搜索商品..."
                clearable
                style="width: 300px"
                @keyup.enter="loadGoods"
              />
              <el-select v-model="goodsStatus" placeholder="状态" clearable @change="loadGoods" style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="上架" value="on" />
                <el-option label="下架" value="off" />
                <el-option label="已售" value="sold" />
              </el-select>
              <el-button type="primary" @click="loadGoods">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>
            <el-table :data="goodsList" style="width: 100%" v-loading="loading">
              <el-table-column prop="title" label="商品标题" />
              <el-table-column prop="category" label="分类" width="120" />
              <el-table-column prop="price" label="价格" width="120">
                <template #default="scope">¥{{ scope.row.price }}</template>
              </el-table-column>
              <el-table-column prop="seller.nickname" label="卖家" width="150" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'on' ? 'success' : scope.row.status === 'sold' ? 'info' : 'warning'">
                    {{ scope.row.status === 'on' ? '上架' : scope.row.status === 'sold' ? '已售' : '下架' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="views" label="浏览" width="80" />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <el-button
                    type="primary"
                    size="small"
                    @click="updateGoodsStatus(scope.row._id, scope.row.status === 'on' ? 'off' : 'on')"
                  >
                    {{ scope.row.status === 'on' ? '下架' : '上架' }}
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="deleteGoods(scope.row._id)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="users-section" v-if="activeMenu === 'users'">
            <div class="section-toolbar">
              <el-input
                v-model="userKeyword"
                placeholder="搜索用户..."
                clearable
                style="width: 300px"
                @keyup.enter="loadUsers"
              />
              <el-button type="primary" @click="loadUsers">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>
            <el-table :data="userList" style="width: 100%" v-loading="loading">
              <el-table-column prop="nickname" label="昵称" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="student_id" label="学号" width="150">
                <template #default="scope">
                  {{ scope.row.student_id || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="role" label="角色" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">
                    {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.disabled ? 'danger' : 'success'">
                    {{ scope.row.disabled ? '已封禁' : '正常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="create_time" label="注册时间" width="180" />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <el-button
                    v-if="scope.row.role !== 'admin'"
                    :type="scope.row.disabled ? 'primary' : 'danger'"
                    size="small"
                    @click="toggleUserStatus(scope.row._id, scope.row.disabled, scope.row.role)"
                  >
                    {{ scope.row.disabled ? '解封' : '封禁' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="messages-section" v-if="activeMenu === 'messages'">
            <div class="section-toolbar">
              <el-input
                v-model="messageKeyword"
                placeholder="搜索留言..."
                clearable
                style="width: 300px"
                @keyup.enter="loadMessages"
              />
              <el-button type="primary" @click="loadMessages">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>
            <el-table :data="messagesList" style="width: 100%" v-loading="loading">
              <el-table-column prop="content" label="留言内容" show-overflow-tooltip />
              <el-table-column prop="user.nickname" label="用户" width="120" />
              <el-table-column prop="goods.title" label="商品" width="200" show-overflow-tooltip />
              <el-table-column prop="create_time" label="时间" width="180" />
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="scope">
                  <el-button
                    type="danger"
                    size="small"
                    @click="deleteMessage(scope.row._id)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataLine,
  Goods,
  User,
  ChatDotRound,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import type { AdminStatistics, Goods as GoodsType, User as UserType, Message as MessageType } from '@/api/types'

const router = useRouter()
const route = useRoute()
const activeMenu = ref('dashboard')
const loading = ref(false)

const stats = ref<AdminStatistics>({
  totalUsers: 0,
  totalGoods: 0,
  totalMessages: 0,
  todayNewUsers: 0,
  todayNewGoods: 0,
  todayNewMessages: 0
})

const goodsList = ref<GoodsType[]>([])
const userList = ref<UserType[]>([])
const messagesList = ref<MessageType[]>([])

const goodsKeyword = ref('')
const goodsStatus = ref('')
const userKeyword = ref('')
const messageKeyword = ref('')

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: '数据统计',
    goods: '商品管理',
    users: '用户管理',
    messages: '留言管理'
  }
  return titles[activeMenu.value] || '数据统计'
})

function handleMenuSelect(index: string) {
  activeMenu.value = index
  router.push(`/admin/${index}`)
  refreshData()
}

watch(() => route.path, (newPath) => {
  const pathMap: Record<string, string> = {
    '/admin/dashboard': 'dashboard',
    '/admin/goods': 'goods',
    '/admin/users': 'users',
    '/admin/messages': 'messages'
  }
  activeMenu.value = pathMap[newPath] || 'dashboard'
  refreshData()
}, { immediate: true })

async function refreshData() {
  switch (activeMenu.value) {
    case 'dashboard':
      await loadStats()
      break
    case 'goods':
      await loadGoods()
      break
    case 'users':
      await loadUsers()
      break
    case 'messages':
      await loadMessages()
      break
  }
}

async function loadStats() {
  loading.value = true
  try {
    const data = await adminApi.getStatistics()
    stats.value = data
  } finally {
    loading.value = false
  }
}

async function loadGoods() {
  loading.value = true
  try {
    const res = await adminApi.getAdminGoodsList({
      keyword: goodsKeyword.value,
      status: goodsStatus.value
    })
    goodsList.value = res.list
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await adminApi.getAdminUserList({
      keyword: userKeyword.value
    })
    userList.value = res.list
  } finally {
    loading.value = false
  }
}

async function loadMessages() {
  loading.value = true
  try {
    const res = await adminApi.getAdminMessageList({
      keyword: messageKeyword.value
    })
    messagesList.value = res.list
  } finally {
    loading.value = false
  }
}

async function updateGoodsStatus(id: string, status: string) {
  try {
    await adminApi.adminUpdateGoodsStatus(id, { status })
    ElMessage.success(status === 'on' ? '上架成功' : '下架成功')
    loadGoods()
  } catch (error) {
    console.error('Update status error:', error)
  }
}

async function deleteGoods(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该商品？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.adminDeleteGoods(id)
    ElMessage.success('删除成功')
    loadGoods()
  } catch {
    // 用户取消
  }
}

async function toggleUserStatus(id: string, isDisabled: boolean, currentRole: string) {
  const action = isDisabled ? '解封' : '封禁'
  try {
    await ElMessageBox.confirm(`确定${action}该用户？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.adminUpdateUserStatus(id, { disabled: !isDisabled })
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch {
    // 用户取消
  }
}

async function deleteMessage(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该留言？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.adminDeleteMessage(id)
    ElMessage.success('删除成功')
    loadMessages()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100vh;
  background: #F8F8F6;
}

.container {
  min-height: 100vh;
}

.sidebar {
  background: white;
  box-shadow: 2px 0 8px rgba(107, 142, 123, 0.08);
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #E5E5E3;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #4A4A4A;
  }
}

.sidebar-menu {
  border: none;
}

.main-content {
  padding: 24px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #4A4A4A;
  }
}

.content-body {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #6B8E7B;
  margin-bottom: 8px;
}

.stat-label {
  color: #7A7A7A;
  font-size: 14px;
}

.section-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
