Page({
  data: {
    userInfo: null,
    loading: true
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      if (res.result.code === 0) {
        this.setData({ userInfo: res.result.data, loading: false })
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

  // 跳转到我的发布
  goToMyGoods() {
    wx.navigateTo({ url: '/pages/myGoods/myGoods' })
  },

  // 跳转到设置页
  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  // 重新绑定学号（跳转到绑定页，可根据需要实现）
  rebind() {
    wx.navigateTo({ url: '/pages/bind/bind' })
  },

  // 进入我的资讯窗口
  goToMyMessages() {
    wx.navigateTo({ url: '/pages/myMessages/myMessages' })
  },

  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },
})