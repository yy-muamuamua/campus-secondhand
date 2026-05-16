<template>
  <view class="container">
    <view v-if="conversations.length === 0" class="empty-state">
      <view class="empty-icon">💬</view>
      <text class="empty-text">暂无聊天记录</text>
      <text class="empty-hint">去逛逛商品，开始聊天吧</text>
    </view>

    <view v-else class="chat-list">
      <view 
        v-for="item in conversations" 
        :key="item._id" 
        class="chat-item"
        @click="goToChat(item._id, item.targetUser)"
      >
        <view class="avatar-wrap">
          <image 
            class="avatar" 
            :src="item.targetUser.avatar || '/images/default-avatar.png'" 
            mode="aspectFill" 
          />
          <view v-if="item.unreadCount > 0" class="badge">{{ item.unreadCount > 99 ? '99+' : item.unreadCount }}</view>
        </view>
        
        <view class="chat-info">
          <view class="chat-header">
            <text class="chat-name">{{ item.targetUser.nickname || '匿名用户' }}</text>
            <text class="chat-time">{{ formatTime(item.updateTime) }}</text>
          </view>
          <text class="chat-preview">
            <text v-if="item.lastMessage.content">{{ item.lastMessage.content }}</text>
            <text v-else class="no-message">暂无消息</text>
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      conversations: []
    }
  },
  onLoad() {
    this.loadConversations()
  },
  onShow() {
    this.loadConversations()
  },
  methods: {
    async loadConversations() {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getConversationList'
        })
        
        if (result.result.success) {
          this.conversations = result.result.data
        }
      } catch (error) {
        console.error('加载聊天列表失败:', error)
      }
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
      
      return `${date.getMonth() + 1}-${date.getDate()}`
    },
    goToChat(conversationId, targetUser) {
      wx.navigateTo({
        url: `/pages/chat/index?conversationId=${conversationId}&nickname=${encodeURIComponent(targetUser.nickname || '')}&avatar=${encodeURIComponent(targetUser.avatar || '')}`
      })
    }
  }
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 150rpx 0;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }

  .empty-text {
    font-size: 32rpx;
    color: #666;
    margin-bottom: 16rpx;
  }

  .empty-hint {
    font-size: 26rpx;
    color: #999;
  }
}

.chat-list {
  padding: 20rpx;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;

  .avatar-wrap {
    position: relative;
    margin-right: 20rpx;

    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      background-color: #f0f0f0;
    }

    .badge {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      min-width: 36rpx;
      height: 36rpx;
      background-color: #f56c6c;
      color: #fff;
      font-size: 22rpx;
      border-radius: 18rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8rpx;
    }
  }

  .chat-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8rpx;

      .chat-name {
        font-size: 30rpx;
        font-weight: 500;
        color: #333;
      }

      .chat-time {
        font-size: 24rpx;
        color: #999;
      }
    }

    .chat-preview {
      font-size: 26rpx;
      color: #999;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .no-message {
        color: #ccc;
      }
    }
  }
}
</style>