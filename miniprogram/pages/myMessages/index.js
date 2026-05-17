Page({
  data: {
    messages: [],
    loading: true
  },

  onShow() {
    this.loadMessages()
  },

  async loadMessages() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyMessages',
        data: {}
      })
      if (res.result.code === 0) {
        this.setData({ messages: res.result.data, loading: false })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '网络错误', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  goToDetail(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/index?goodsId=${goodsId}` })
  },

  formatTime(dateStr) {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
  }
})
