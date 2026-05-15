<template>
  <div class="goods-detail">
    <div class="detail-header">
      <el-button icon="ArrowLeft" @click="$router.back()" circle />
      <span>商品详情</span>
    </div>

    <div class="detail-content">
      <div class="goods-images" v-if="goodsDetail">
        <el-carousel :interval="0" height="400px" type="card">
          <el-carousel-item v-for="(image, index) in goodsDetail.images" :key="index">
            <el-image :src="image" fit="cover" />
          </el-carousel-item>
        </el-carousel>
      </div>

      <div class="goods-info card">
        <div class="goods-price">¥{{ goodsDetail?.price }}</div>
        <h1 class="goods-title">{{ goodsDetail?.title }}</h1>
        <div class="goods-meta">
          <span>浏览 {{ goodsDetail?.views }}</span>
          <span>{{ goodsDetail?.create_time }}</span>
        </div>
        <div class="goods-category">
          <el-tag type="info">{{ goodsDetail?.category }}</el-tag>
          <el-tag v-if="goodsDetail?.status !== 'on'" :type="goodsDetail?.status === 'sold' ? 'success' : 'warning'">
            {{ goodsDetail?.status === 'sold' ? '已售出' : '已下架' }}
          </el-tag>
        </div>
      </div>

      <div class="goods-description card">
        <h3>商品描述</h3>
        <p>{{ goodsDetail?.description }}</p>
      </div>

      <div class="seller-info card">
        <h3>卖家信息</h3>
        <div class="seller-profile">
          <el-avatar :size="64" :src="goodsDetail?.seller?.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="seller-detail">
            <div class="seller-name">{{ goodsDetail?.seller?.nickname }}</div>
            <div class="seller-contact">
              <span v-if="goodsDetail?.seller?.contact_wechat">微信: {{ goodsDetail.seller.contact_wechat }}</span>
              <span v-if="goodsDetail?.seller?.contact_phone">电话: {{ goodsDetail.seller.contact_phone }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-bar" v-if="isLoggedIn">
        <el-button
          :type="isFavorited ? 'info' : 'primary'"
          @click="toggleFavorite"
          class="action-btn"
        >
          <Heart v-if="isFavorited" />
          <HeartFilled v-else />
          {{ isFavorited ? '已收藏' : '收藏' }}
        </el-button>
        <el-button type="primary" class="action-btn" @click="scrollToMessages">
          <el-icon><ChatDotRound /></el-icon>
          联系卖家
        </el-button>
      </div>
    </div>

    <div class="messages-section" id="messages-section">
      <h3>留言</h3>
      <div class="message-input" v-if="isLoggedIn">
        <el-input
          v-model="messageContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的问题..."
        />
        <el-button type="primary" @click="sendMessage" :loading="sendingMessage">
          发送
        </el-button>
      </div>
      <div class="message-list">
        <div v-for="message in messages" :key="message._id" class="message-item">
          <div class="message-header">
            <el-avatar :size="40" :src="message.user?.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="message-user">
              <div class="user-name">{{ message.user?.nickname }}</div>
              <div class="message-time">{{ message.create_time }}</div>
            </div>
          </div>
          <div class="message-content">{{ message.content }}</div>
          <div v-if="message.reply" class="message-reply">
            <div class="reply-label">卖家回复:</div>
            <div class="reply-content">{{ message.reply }}</div>
          </div>
          <div v-if="isOwner && !message.reply" class="reply-action">
            <el-button type="text" @click="showReplyInput = !showReplyInput">回复</el-button>
            <div v-if="showReplyInput" class="reply-input-box">
              <el-input v-model="replyContent" placeholder="回复买家..." />
              <el-button type="primary" size="small" @click="replyToMessage(message._id)">发送</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { goodsApi, messagesApi, favoritesApi } from '@/api'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Heart, HeartFilled, ChatDotRound, User } from '@element-plus/icons-vue'
import type { Goods, Message } from '@/api/types'

const route = useRoute()
const userStore = useUserStore()

const goodsDetail = ref<Goods | null>(null)
const messages = ref<Message[]>([])
const isFavorited = ref(false)
const favoriteId = ref('')
const messageContent = ref('')
const replyContent = ref('')
const showReplyInput = ref(false)
const sendingMessage = ref(false)
const loading = ref(false)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isOwner = computed(() => userStore.userInfo?._id === goodsDetail.value?.seller?._id)

async function loadGoodsDetail() {
  const goodsId = route.params.id as string
  loading.value = true
  try {
    goodsDetail.value = await goodsApi.getGoodsDetail(goodsId)
    loadMessages()
    if (userStore.isLoggedIn) {
      checkFavorite()
    }
  } finally {
    loading.value = false
  }
}

async function loadMessages() {
  const goodsId = route.params.id as string
  const res = await messagesApi.getMessagesByGoods(goodsId)
  messages.value = res.list
}

async function checkFavorite() {
  try {
    const res = await favoritesApi.checkFavorite(route.params.id as string)
    isFavorited.value = res.isFavorited
    favoriteId.value = res.favoriteId || ''
  } catch (error) {
    console.error('Check favorite error:', error)
  }
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (isFavorited.value && favoriteId.value) {
      await favoritesApi.removeFavorite(favoriteId.value)
      isFavorited.value = false
      ElMessage.success('已取消收藏')
    } else {
      const res = await favoritesApi.addFavorite({ goodsId: route.params.id as string })
      isFavorited.value = true
      favoriteId.value = res._id
      ElMessage.success('收藏成功')
    }
  } catch (error) {
    console.error('Toggle favorite error:', error)
  }
}

async function sendMessage() {
  if (!messageContent.value.trim()) {
    ElMessage.warning('请输入留言内容')
    return
  }

  sendingMessage.value = true
  try {
    await messagesApi.addMessage({
      goodsId: route.params.id as string,
      content: messageContent.value
    })
    ElMessage.success('留言成功')
    messageContent.value = ''
    loadMessages()
  } finally {
    sendingMessage.value = false
  }
}

async function replyToMessage(messageId: string) {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  try {
    await messagesApi.replyMessage(messageId, { reply: replyContent.value })
    ElMessage.success('回复成功')
    replyContent.value = ''
    showReplyInput.value = false
    loadMessages()
  } catch (error) {
    console.error('Reply message error:', error)
  }
}

function scrollToMessages() {
  document.getElementById('messages-section')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  loadGoodsDetail()
})
</script>

<style lang="scss" scoped>
.goods-detail {
  min-height: 100vh;
  background: #F8F8F6;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  font-size: 18px;
  font-weight: 500;
}

.detail-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.goods-images {
  margin-bottom: 24px;
}

.goods-info {
  padding: 24px;
  margin-bottom: 16px;
}

.goods-price {
  font-size: 32px;
  font-weight: 600;
  color: #C9A7A7;
  margin-bottom: 12px;
}

.goods-title {
  font-size: 24px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 16px;
}

.goods-meta {
  display: flex;
  gap: 16px;
  color: #A0A0A0;
  font-size: 14px;
  margin-bottom: 16px;
}

.goods-category {
  display: flex;
  gap: 8px;
}

.goods-description {
  padding: 24px;
  margin-bottom: 16px;

  h3 {
    margin-bottom: 16px;
    color: #4A4A4A;
  }

  p {
    color: #7A7A7A;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.seller-info {
  padding: 24px;
  margin-bottom: 80px;

  h3 {
    margin-bottom: 16px;
    color: #4A4A4A;
  }
}

.seller-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.seller-detail {
  flex: 1;
}

.seller-name {
  font-size: 18px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 4px;
}

.seller-contact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #7A7A7A;
  font-size: 14px;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px 24px;
  display: flex;
  gap: 16px;
  box-shadow: 0 -2px 8px rgba(107, 142, 123, 0.08);
}

.action-btn {
  flex: 1;
  height: 48px;
  font-size: 16px;
}

.messages-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;

  h3 {
    margin-bottom: 16px;
    color: #4A4A4A;
  }
}

.message-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.message-user {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  color: #A0A0A0;
}

.message-content {
  color: #7A7A7A;
  margin-left: 52px;
}

.message-reply {
  margin-left: 52px;
  margin-top: 12px;
  padding: 12px;
  background: #E8EDE9;
  border-radius: 8px;
  border-left: 3px solid #6B8E7B;
}

.reply-label {
  font-weight: 500;
  color: #6B8E7B;
  margin-bottom: 4px;
}

.reply-content {
  color: #4A6B5B;
}

.reply-action {
  margin-left: 52px;
  margin-top: 8px;
}

.reply-input-box {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
