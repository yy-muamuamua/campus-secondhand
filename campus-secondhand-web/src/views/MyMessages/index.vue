<template>
  <div class="my-messages-container">
    <div class="my-messages-header">
      <el-button icon="ArrowLeft" @click="$router.back()" circle />
      <span>我的留言</span>
    </div>

    <div class="my-messages-content">
      <el-empty v-if="!loading && messagesList.length === 0" description="暂无留言" />
      
      <div v-else class="messages-list">
        <div
          v-for="item in messagesList"
          :key="item._id"
          class="message-item card"
        >
          <div class="message-goods" @click="$router.push(`/goods/${item.goods?._id}`)">
            <div class="goods-thumb">
              <el-image
                :src="item.goods?.images[0]"
                fit="cover"
              />
            </div>
            <div class="goods-info">
              <div class="goods-title">{{ item.goods?.title }}</div>
              <div class="goods-price">¥{{ item.goods?.price }}</div>
            </div>
          </div>
          
          <div class="message-content">
            <div class="message-user">
              <el-avatar :size="32" :src="item.user?.avatar" />
              <span class="user-name">{{ item.user?.nickname }}</span>
              <span class="message-time">{{ item.create_time }}</span>
            </div>
            <p class="message-text">{{ item.content }}</p>
            <div v-if="item.reply" class="message-reply">
              <span class="reply-label">你的回复:</span>
              <span class="reply-text">{{ item.reply }}</span>
            </div>
            <div v-if="!item.reply && isOwner(item)" class="reply-action">
              <el-button type="text" @click="showReplyBox(item)">回复</el-button>
            </div>
          </div>

          <div v-if="item.showReplyBox" class="reply-box">
            <el-input
              v-model="item.replyText"
              type="textarea"
              :rows="2"
              placeholder="回复留言..."
            />
            <div class="reply-box-actions">
              <el-button size="small" @click="item.showReplyBox = false">取消</el-button>
              <el-button
                type="primary"
                size="small"
                :loading="item.replying"
                @click="replyToMessage(item)"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { userApi, messagesApi } from '@/api'
import { useUserStore } from '@/stores/useUserStore'

const router = useRouter()
const userStore = useUserStore()
const messagesList = ref<any[]>([])
const loading = ref(false)

async function loadMessages() {
  loading.value = true
  try {
    const res = await userApi.getMyMessages()
    messagesList.value = res.list
  } finally {
    loading.value = false
  }
}

function isOwner(item: any) {
  return item.goods?.seller?._id === userStore.userInfo?._id
}

function showReplyBox(item: any) {
  item.showReplyBox = true
  item.replyText = ''
  item.replying = false
}

async function replyToMessage(item: any) {
  if (!item.replyText.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  item.replying = true
  try {
    await messagesApi.replyMessage(item._id, { reply: item.replyText })
    ElMessage.success('回复成功')
    item.reply = item.replyText
    item.showReplyBox = false
  } catch (error) {
    console.error('Reply error:', error)
  } finally {
    item.replying = false
  }
}

onMounted(() => {
  loadMessages()
})
</script>

<style lang="scss" scoped>
.my-messages-container {
  min-height: 100vh;
  background: #F8F8F6;
}

.my-messages-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  font-size: 18px;
  font-weight: 500;
}

.my-messages-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  padding: 16px;
}

.message-goods {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E5E3;
  cursor: pointer;
}

.goods-thumb {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.goods-info {
  flex: 1;
}

.goods-title {
  font-size: 15px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-price {
  font-size: 18px;
  font-weight: 600;
  color: #C9A7A7;
}

.message-content {
  margin-bottom: 12px;
}

.message-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.user-name {
  font-weight: 500;
  color: #4A4A4A;
}

.message-time {
  color: #A0A0A0;
  font-size: 12px;
}

.message-text {
  color: #7A7A7A;
  margin-bottom: 8px;
}

.message-reply {
  padding: 12px;
  background: #E8EDE9;
  border-radius: 8px;
  border-left: 3px solid #6B8E7B;
}

.reply-label {
  font-weight: 500;
  color: #6B8E7B;
}

.reply-text {
  color: #4A6B5B;
}

.reply-action {
  margin-top: 8px;
}

.reply-box {
  padding-top: 12px;
  border-top: 1px solid #E5E5E3;
}

.reply-box-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
