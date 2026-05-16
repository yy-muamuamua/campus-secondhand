// pages/chat/index.js
Page({
  data: {
    conversationId: '',
    targetOpenid: '',
    targetNickname: '',
    targetAvatar: '',
    targetUser: {},
    myAvatar: '',
    openid: '',
    messages: [],
    inputText: '',
    scrollToId: '',
    pollingTimer: null
  },

  onLoad(options) {
    this.setData({
      conversationId: options.conversationId || '',
      targetOpenid: options.targetOpenid || '',
      targetNickname: decodeURIComponent(options.nickname || ''),
      targetAvatar: decodeURIComponent(options.avatar || '')
    }, () => {
      this.loadMessages()
      this.startPolling()
    })

    if (options.targetNickname) {
      wx.setNavigationBarTitle({ title: decodeURIComponent(options.targetNickname) })
    }
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

  async loadMessages() {
    if (!this.data.conversationId) return

    try {
      const res = await wx.cloud.callFunction({
        name: 'getChatHistory',
        data: { conversationId: this.data.conversationId }
      })

      if (res.result.success) {
        this.setData({
          messages: res.result.data.messages,
          targetUser: res.result.data.targetUser
        }, () => {
          if (res.result.data.targetUser.nickname) {
            wx.setNavigationBarTitle({ title: res.result.data.targetUser.nickname })
          }
          this.scrollToBottom()
        })
      }
    } catch (error) {
      console.error('加载消息失败', error)
    }
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  async sendMessage() {
    const content = this.data.inputText.trim()
    if (!content) return

    this.setData({ inputText: '' })

    try {
      await wx.cloud.callFunction({
        name: 'sendMessage',
        data: {
          conversationId: this.data.conversationId,
          targetOpenid: this.data.targetUser.openid || this.data.targetOpenid,
          content: content
        }
      })
      await this.loadMessages()
    } catch (error) {
      console.error('发送消息失败', error)
      wx.showToast({ title: '发送失败', icon: 'none' })
      this.setData({ inputText: content })
    }
  },

  async markAsRead() {
    if (!this.data.conversationId) return

    try {
      await wx.cloud.callFunction({
        name: 'markAsRead',
        data: { conversationId: this.data.conversationId }
      })
    } catch (error) {
      console.error('标记已读失败', error)
    }
  },

  startPolling() {
    this.setData({
      pollingTimer: setInterval(() => {
        this.loadMessages()
      }, 3000)
    })
  },

  stopPolling() {
    if (this.data.pollingTimer) {
      clearInterval(this.data.pollingTimer)
      this.setData({ pollingTimer: null })
    }
  },

  scrollToBottom() {
    if (this.data.messages.length > 0) {
      const lastId = this.data.messages[this.data.messages.length - 1]._id
      this.setData({ scrollToId: `msg-${lastId}` })
    }
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
})