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
          <h2>用户管理</h2>
          <div class="header-actions">
            <el-button icon="Refresh" @click="loadUsers">
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
import type { User as UserType } from '@/api/types'

const router = useRouter()
const activeMenu = ref('users')
const loading = ref(false)

const userList = ref<UserType[]>([])
const userKeyword = ref('')

function handleMenuSelect(index: string) {
  activeMenu.value = index
  router.push(`/admin/${index}`)
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

onMounted(() => {
  loadUsers()
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