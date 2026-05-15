<template>
  <div class="favorites-container">
    <div class="favorites-header">
      <el-button icon="ArrowLeft" @click="$router.back()" circle />
      <span>我的收藏</span>
    </div>

    <div class="favorites-content">
      <el-empty v-if="!loading && favoritesList.length === 0" description="暂无收藏">
        <el-button type="primary" @click="$router.push('/')">去逛逛</el-button>
      </el-empty>
      
      <div v-else class="favorites-list">
        <div
          v-for="item in favoritesList"
          :key="item._id"
          class="favorite-item card"
        >
          <div class="item-image">
            <el-image
              :src="item.goods?.images[0]"
              fit="cover"
              @click="$router.push(`/goods/${item.goods?._id}`)"
            />
          </div>
          <div class="item-info" @click="$router.push(`/goods/${item.goods?._id}`)">
            <div class="item-title">{{ item.goods?.title }}</div>
            <div class="item-price">¥{{ item.goods?.price }}</div>
            <div class="item-meta">
              <span>{{ item.goods?.seller?.nickname }}</span>
              <span class="time">{{ item.create_time }}</span>
            </div>
          </div>
          <div class="item-actions">
            <el-button
              type="danger"
              size="small"
              @click="removeFavorite(item._id)"
            >
              取消收藏
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
import { favoritesApi } from '@/api'

const router = useRouter()
const favoritesList = ref<any[]>([])
const loading = ref(false)

async function loadFavorites() {
  loading.value = true
  try {
    const res = await favoritesApi.getMyFavorites()
    favoritesList.value = res.list
  } finally {
    loading.value = false
  }
}

async function removeFavorite(id: string) {
  try {
    await ElMessageBox.confirm('确定取消收藏？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await favoritesApi.removeFavorite(id)
    ElMessage.success('已取消收藏')
    loadFavorites()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style lang="scss" scoped>
.favorites-container {
  min-height: 100vh;
  background: #F8F8F6;
}

.favorites-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  font-size: 18px;
  font-weight: 500;
}

.favorites-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.favorite-item {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.item-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.item-info {
  flex: 1;
  cursor: pointer;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 8px;
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

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #A0A0A0;
}

.item-actions {
  display: flex;
  align-items: center;
}
</style>
