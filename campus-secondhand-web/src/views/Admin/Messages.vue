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
          <h2>留言管理</h2>
          <div class="header-actions">
            <el-button icon="Refresh" @click="loadMessages">
              刷新
            </el-button>
            <el-button @click="$router.push('/')">
              返回首页
            </el-button>
          </div>
        </div>

        <div class="content-body">
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
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
import type { Message as MessageType } from '@/api/types'

const router = useRouter()
const activeMenu = ref('messages')
const loading = ref(false)

const messagesList = ref<MessageType[]>([])
const messageKeyword = ref('')

function handleMenuSelect(index: string) {
  activeMenu.value = index
  router.push(`/admin/${index}`)
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
  loadMessages()
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

.section-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>