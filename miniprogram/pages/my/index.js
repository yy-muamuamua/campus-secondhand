// pages/my/index.js
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

  goToMyGoods() {
    wx.navigateTo({ url: '/pages/myGoods/myGoods' })
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  goToMyMessages() {
    wx.navigateTo({ url: '/pages/myMessages/myMessages' })
  },

  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  goToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  }
})
