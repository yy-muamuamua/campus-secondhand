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
          <h2>商品管理</h2>
          <div class="header-actions">
            <el-button icon="Refresh" @click="loadGoods">
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
import type { Goods as GoodsType } from '@/api/types'

const router = useRouter()
const activeMenu = ref('goods')
const loading = ref(false)

const goodsList = ref<GoodsType[]>([])
const goodsKeyword = ref('')
const goodsStatus = ref('')

function handleMenuSelect(index: string) {
  activeMenu.value = index
  router.push(`/admin/${index}`)
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

onMounted(() => {
  loadGoods()
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