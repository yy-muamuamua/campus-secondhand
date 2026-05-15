<template>
  <div class="home">
    <el-container class="home-container">
      <el-header class="header">
        <div class="header-content">
          <div class="logo">校园二手</div>
          <el-menu
            :default-active="activeMenu"
            class="nav-menu"
            mode="horizontal"
            @select="handleNavSelect"
          >
            <el-menu-item index="home">首页</el-menu-item>
            <el-menu-item index="publish" v-if="isLoggedIn">发布商品</el-menu-item>
          </el-menu>
          <div class="user-actions">
            <template v-if="isLoggedIn">
              <el-dropdown @command="handleCommand">
                <div class="user-info">
                  <el-avatar :size="32" :src="userInfo?.avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span>{{ userInfo?.nickname }}</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                    <el-dropdown-item command="favorites">我的收藏</el-dropdown-item>
                    <el-dropdown-item command="my-goods">我的商品</el-dropdown-item>
                    <el-dropdown-item v-if="isAdmin" command="admin">管理后台</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button type="primary" @click="$router.push('/login')">登录</el-button>
              <el-button @click="$router.push('/register')">注册</el-button>
            </template>
          </div>
        </div>
      </el-header>

      <el-main class="main-content">
        <div class="search-section">
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索商品..."
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>

        <div class="category-section">
          <div class="category-list">
            <div
              v-for="category in categories"
              :key="category.value"
              :class="['category-item', { active: selectedCategory === category.value }]"
              @click="selectCategory(category.value)"
            >
              <div class="category-icon">{{ category.icon }}</div>
              <span>{{ category.label }}</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <el-radio-group v-model="sortBy" @change="handleSort">
            <el-radio-button label="create_time">最新</el-radio-button>
            <el-radio-button label="price">价格</el-radio-button>
            <el-radio-button label="views">热度</el-radio-button>
          </el-radio-group>
          <div class="price-filter">
            <el-input-number v-model="minPrice" placeholder="最低价" :min="0" style="width: 120px" />
            <span class="price-separator">-</span>
            <el-input-number v-model="maxPrice" placeholder="最高价" :min="0" style="width: 120px" />
            <el-button @click="applyPriceFilter">筛选</el-button>
          </div>
        </div>

        <div class="goods-grid" v-loading="loading">
          <el-empty v-if="!loading && goodsList.length === 0" description="暂无商品" />
          <div v-else class="goods-list">
            <div
              v-for="goods in goodsList"
              :key="goods._id"
              class="goods-item card"
              @click="$router.push(`/goods/${goods._id}`)"
            >
              <div class="goods-image">
                <el-image
                  :src="goods.images[0] || '/default-goods-image.jpg'"
                  fit="cover"
                >
                  <template #error>
                    <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div v-if="goods.status !== 'on'" class="goods-status">
                  {{ goods.status === 'sold' ? '已售出' : '已下架' }}
                </div>
              </div>
              <div class="goods-info">
                <h3 class="goods-title">{{ goods.title }}</h3>
                <div class="goods-price">¥{{ goods.price }}</div>
                <div class="goods-meta">
                  <span>{{ goods.seller?.nickname }}</span>
                  <span class="views">{{ goods.views }}浏览</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination" v-if="hasMore">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </el-main>

      <el-footer class="footer">
        <p>© 2024 校园二手交易平台</p>
      </el-footer>
    </el-container>

    <el-button
      v-if="isLoggedIn"
      class="publish-fab"
      type="primary"
      circle
      @click="$router.push('/publish')"
    >
      <el-icon><Plus /></el-icon>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { useGoodsStore } from '@/stores/useGoodsStore'
import { Search, Plus, User, Picture } from '@element-plus/icons-vue'
import type { GoodsCategory } from '@/api/types'

const router = useRouter()
const userStore = useUserStore()
const goodsStore = useGoodsStore()

const categories = [
  { label: '全部', value: '' },
  { label: '书籍', value: '书籍' },
  { label: '电子产品', value: '电子产品' },
  { label: '生活用品', value: '生活用品' },
  { label: '其他', value: '其他' }
]

const searchKeyword = ref('')
const selectedCategory = ref('')
const sortBy = ref('create_time')
const minPrice = ref<number>()
const maxPrice = ref<number>()
const activeMenu = ref('home')

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)
const userInfo = computed(() => userStore.userInfo)
const goodsList = computed(() => goodsStore.goodsList)
const loading = computed(() => goodsStore.loading)
const total = computed(() => goodsStore.total)
const currentPage = computed(() => goodsStore.currentPage)
const pageSize = computed(() => goodsStore.pageSize)
const hasMore = computed(() => currentPage.value * pageSize.value < total.value)

async function loadGoods() {
  await goodsStore.fetchGoodsList({
    keyword: searchKeyword.value || undefined,
    category: selectedCategory.value || undefined,
    sortBy: sortBy.value as any,
    sortOrder: 'desc',
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    status: 'on'
  })
}

function handleSearch() {
  goodsStore.resetList()
  loadGoods()
}

function selectCategory(category: string) {
  selectedCategory.value = category
  goodsStore.resetList()
  loadGoods()
}

function handleSort() {
  goodsStore.resetList()
  loadGoods()
}

function applyPriceFilter() {
  goodsStore.resetList()
  loadGoods()
}

function handlePageChange(page: number) {
  goodsStore.setCurrentPage(page)
  loadGoods()
}

function handleNavSelect(index: string) {
  if (index === 'home') {
    router.push('/')
  } else if (index === 'publish') {
    router.push('/publish')
  }
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'favorites':
      router.push('/favorites')
      break
    case 'my-goods':
      router.push('/my-goods')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}

onMounted(() => {
  loadGoods()
})
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.home-container {
  flex: 1;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  padding: 0;
  height: auto;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: 600;
  color: #6B8E7B;
}

.nav-menu {
  border-bottom: none;
  flex: 1;
  margin: 0 40px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
}

.category-section {
  margin-bottom: 24px;
}

.category-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 0;
}

.category-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #E8EDE9;
  }

  &.active {
    background: #E8EDE9;
    color: #6B8E7B;
  }
}

.category-icon {
  font-size: 32px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-separator {
  color: #A0A0A0;
}

.goods-grid {
  flex: 1;
}

.goods-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.goods-item {
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.goods-image {
  position: relative;
  width: 100%;
  padding-top: 75%;
}

.goods-image :deep(.el-image) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: #F8F8F6;
  color: #A0A0A0;
  font-size: 32px;
}

.goods-status {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #A0A0A0;
  font-size: 12px;
  border-radius: 4px;
}

.goods-info {
  padding: 16px;
}

.goods-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-price {
  font-size: 20px;
  font-weight: 600;
  color: #C9A7A7;
  margin-bottom: 8px;
}

.goods-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #A0A0A0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.publish-fab {
  position: fixed;
  right: 32px;
  bottom: 32px;
  width: 56px;
  height: 56px;
  font-size: 24px;
  box-shadow: 0 4px 16px rgba(107, 142, 123, 0.2);
}

.footer {
  background: white;
  text-align: center;
  padding: 24px;
  color: #7A7A7A;
}

@media screen and (max-width: 768px) {
  .goods-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .price-filter {
    justify-content: space-between;
  }
}
</style>
