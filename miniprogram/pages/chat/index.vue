<template>
  <view class="container">
    <scroll-view 
      class="message-list" 
      scroll-y 
      :scroll-into-view="scrollToId"
      scroll-with-animation
    >
      <view 
        v-for="(message, index) in messages" 
        :key="message._id"
        :id="'msg-' + message._id"
        :class="['message-item', { self: message.senderOpenid === openid }]"
      >
        <image 
          class="avatar" 
          :src="message.senderOpenid === openid ? myAvatar : targetAvatar" 
          mode="aspectFill" 
        />
        <view class="message-content">
          <view class="message-bubble">
            <text class="message-text">{{ message.content }}</text>
          </view>
          <text class="message-time">{{ formatTime(message.createTime) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="input-bar">
      <input 
        v-model="inputText" 
        class="message-input" 
        placeholder="输入消息..."
        maxlength="500"
        @confirm="sendMessage"
      />
      <button class="send-btn" :class="{ disabled: !inputText.trim() }" @click="sendMessage">发送</button>
    </view>
  </view>
</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      conversationId: '',
      targetOpenid: '',
      targetNickname: '',
      targetAvatar: '',
      targetUser: null,
      myAvatar: '',
      openid: '',
      messages: [],
      inputText: '',
      scrollToId: '',
      pollingTimer: null
    }
  },
  onLoad(options) {
    this.conversationId = options.conversationId
    this.targetNickname = decodeURIComponent(options.nickname || '')
    this.targetAvatar = decodeURIComponent(options.avatar || '')
    this.openid = app.globalData.openid
    this.myAvatar = app.globalData.userInfo?.avatar || ''
    
    this.loadMessages()
    this.startPolling()
  },
  onShow() {
    this.markAsRead()
  },
  onHide() {
    this.stopPolling()
  },
  onUnload() {
    this.stopPolling()
  },
  methods: {
    async loadMessages() {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getChatHistory',
          data: { conversationId: this.conversationId }
        })
        
        if (result.result.success) {
          this.messages = result.result.data.messages
          this.targetUser = result.result.data.targetUser
          this.targetAvatar = this.targetUser.avatar || this.targetAvatar
          this.targetNickname = this.targetUser.nickname || this.targetNickname
          this.scrollToBottom()
        }
      } catch (error) {
        console.error('加载消息失败:', error)
      }
    },
    async sendMessage() {
      if (!this.inputText.trim()) return

      const content = this.inputText.trim()
      this.inputText = ''

      try {
        const result = await wx.cloud.callFunction({
          name: 'sendMessage',
          data: {
            targetOpenid: this.targetUser?.openid || this.targetOpenid,
            content,
            conversationId: this.conversationId
          }
        })

        if (result.result.success) {
          this.loadMessages()
        } else {
          wx.showToast({ title: '发送失败', icon: 'none' })
          this.inputText = content
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        wx.showToast({ title: '发送失败', icon: 'none' })
        this.inputText = content
      }
    },
    async markAsRead() {
      try {
        await wx.cloud.callFunction({
          name: 'markAsRead',
          data: { conversationId: this.conversationId }
        })
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    },
    startPolling() {
      this.pollingTimer = setInterval(() => {
        this.loadMessages()
      }, 3000)
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
    },
    scrollToBottom() {
      setTimeout(() => {
        if (this.messages.length > 0) {
          this.scrollToId = 'msg-' + this.messages[this.messages.length - 1]._id
        }
      }, 100)
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  padding: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 24rpx;

  &.self {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background-color: #1989fa;

      .message-text {
        color: #fff;
      }
    }
  }

  .avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
    flex-shrink: 0;
  }

  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    margin: 0 16rpx;

    .message-bubble {
      background-color: #fff;
      padding: 20rpx 24rpx;
      border-radius: 24rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

      &:before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border: 12rpx solid transparent;
        top: 16rpx;
      }

      .message-text {
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
        word-break: break-all;
      }
    }

    .message-time {
      font-size: 22rpx;
      color: #999;
      margin-top: 8rpx;
    }
  }
}

.message-item:not(.self) .message-bubble {
  border-top-left-radius: 8rpx;

  &:before {
    left: -12rpx;
    border-right-color: #fff;
  }
}

.message-item.self .message-bubble {
  border-top-right-radius: 8rpx;

  &:before {
    right: -12rpx;
    border-left-color: #1989fa;
  }
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .message-input {
    flex: 1;
    height: 72rpx;
    padding: 0 24rpx;
    background-color: #f5f5f5;
    border-radius: 36rpx;
    font-size: 28rpx;
  }

  .send-btn {
    margin-left: 20rpx;
    padding: 16rpx 40rpx;
    font-size: 28rpx;
    background-color: #1989fa;
    color: #fff;
    border-radius: 36rpx;

    &.disabled {
      background-color: #ccc;
    }
  }
}
</style>