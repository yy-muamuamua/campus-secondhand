<template>
  <div class="my-goods-container">
    <div class="my-goods-header">
      <el-button icon="ArrowLeft" @click="$router.back()" circle />
      <span>我的商品</span>
      <div class="header-tabs">
        <el-tabs v-model="activeTab" @tab-change="loadGoods">
          <el-tab-pane label="全部" name="" />
          <el-tab-pane label="上架中" name="on" />
          <el-tab-pane label="已售出" name="sold" />
          <el-tab-pane label="已下架" name="off" />
        </el-tabs>
      </div>
    </div>

    <div class="my-goods-content">
      <el-empty v-if="!loading && goodsList.length === 0" description="暂无商品">
        <el-button type="primary" @click="$router.push('/publish')">发布商品</el-button>
      </el-empty>
      
      <div v-else class="goods-list">
        <div
          v-for="item in goodsList"
          :key="item._id"
          class="goods-item card"
        >
          <div class="item-image">
            <el-image
              :src="item.images[0]"
              fit="cover"
              @click="$router.push(`/goods/${item._id}`)"
            />
          </div>
          <div class="item-info">
            <div class="item-title" @click="$router.push(`/goods/${item._id}`)">
              {{ item.title }}
            </div>
            <div class="item-price">¥{{ item.price }}</div>
            <div class="item-status">
              <el-tag :type="item.status === 'on' ? 'success' : item.status === 'sold' ? 'info' : 'warning'">
                {{ item.status === 'on' ? '上架中' : item.status === 'sold' ? '已售出' : '已下架' }}
              </el-tag>
              <span class="item-meta">浏览 {{ item.views }} · {{ item.create_time }}</span>
            </div>
          </div>
          <div class="item-actions">
            <el-button
              v-if="item.status !== 'sold'"
              size="small"
              @click="updateStatus(item._id, item.status === 'on' ? 'off' : 'on')"
            >
              {{ item.status === 'on' ? '下架' : '上架' }}
            </el-button>
            <el-button
              v-if="item.status === 'on'"
              size="small"
              type="primary"
              @click="markAsSold(item._id)"
            >
              标记已售
            </el-button>
            <el-button
              v-if="item.status !== 'sold'"
              size="small"
              @click="editGoods(item._id)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteGoods(item._id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { goodsApi, userApi } from '@/api'

const router = useRouter()
const goodsList = ref<any[]>([])
const activeTab = ref('')
const loading = ref(false)

async function loadGoods() {
  loading.value = true
  try {
    const res = await userApi.getMyGoods({ status: activeTab.value })
    goodsList.value = res.list
  } finally {
    loading.value = false
  }
}

async function updateStatus(id: string, status: string) {
  try {
    await goodsApi.updateGoodsStatus(id, { status })
    ElMessage.success(status === 'on' ? '上架成功' : '下架成功')
    loadGoods()
  } catch (error) {
    console.error('Update status error:', error)
  }
}

async function markAsSold(id: string) {
  try {
    await ElMessageBox.confirm('确定标记为已售出？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await goodsApi.updateGoodsStatus(id, { status: 'sold' })
    ElMessage.success('标记成功')
    loadGoods()
  } catch {
    // 用户取消
  }
}

function editGoods(id: string) {
  router.push(`/edit/${id}`)
}

async function deleteGoods(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该商品？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await goodsApi.deleteGoods(id)
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
.my-goods-container {
  min-height: 100vh;
  background: #F8F8F6;
}

.my-goods-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  font-size: 18px;
  font-weight: 500;
}

.header-tabs {
  margin-left: auto;
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.my-goods-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.goods-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goods-item {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.item-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 8px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 20px;
  font-weight: 600;
  color: #C9A7A7;
  margin-bottom: 8px;
}

.item-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-meta {
  font-size: 12px;
  color: #A0A0A0;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
