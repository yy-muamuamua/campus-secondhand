// pages/chatList/index.js
Page({
  data: {
    conversations: []
  },

  onLoad() {
    this.loadConversations()
  },

  onShow() {
    this.loadConversations()
  },

  onPullDownRefresh() {
    this.loadConversations().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadConversations() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getConversationList'
      })

      if (res.result.success) {
        this.setData({
          conversations: res.result.data
        })
      }
    } catch (error) {
      console.error('加载聊天列表失败', error)
    }
  },

  goToChat(e) {
    const conversationId = e.currentTarget.dataset.id
    const user = e.currentTarget.dataset.user
    wx.navigateTo({
      url: `/pages/chat/index?conversationId=${conversationId}&nickname=${encodeURIComponent(user.nickname || '')}&avatar=${encodeURIComponent(user.avatar || '')}`
    })
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
  }
})