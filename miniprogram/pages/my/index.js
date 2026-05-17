// pages/my/index.js
Page({
  data: {
    userInfo: null,
    loading: true
  },

  onShow() {
    this.loadUserInfo()
  },

  showToast(message, icon = 'none') {
    const toast = this.selectComponent('#toast')
    if (toast) {
      toast.show({
        msg: message,
        icon: icon === 'success' ? 'success' : 'warn',
        duration: icon === 'success' ? 1500 : 2000
      })
    } else {
      wx.showToast({ title: message, icon: 'none' })
    }
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
        this.showToast(res.result.message)
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error(err)
      this.showToast('网络错误')
      this.setData({ loading: false })
    }
  },

  goToMyGoods() {
    wx.navigateTo({ url: '/pages/myGoods/index' })
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  goToMyMessages() {
    wx.navigateTo({ url: '/pages/myMessages/index' })
  },

  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  goToProfile() {
    wx.navigateTo({ url: '/pages/profile/index' })
  },

  goToOrderList(e) {
    const type = e.currentTarget.dataset.type || ''
    wx.navigateTo({ 
      url: type ? `/pages/orderList/index?type=${type}` : '/pages/orderList/index' 
    })
  }
})
