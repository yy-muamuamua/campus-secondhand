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
    // 先从本地存储读取用户信息
    const localUserInfo = wx.getStorageSync('userInfo')
    if (localUserInfo) {
      console.log('从本地存储读取用户信息:', localUserInfo)
      this.setData({ userInfo: localUserInfo, loading: false })
    }
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      if (res.result.code === 0) {
        const userInfo = res.result.data
        this.setData({ userInfo, loading: false })
        // 更新本地存储
        wx.setStorageSync('userInfo', userInfo)
      } else {
        if (!localUserInfo) {
          this.setData({ userInfo: null, loading: false })
        }
      }
    } catch (err) {
      console.error(err)
      if (!localUserInfo) {
        this.setData({ userInfo: null, loading: false })
      }
    }
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  },

  rebind() {
    wx.navigateTo({ url: '/pages/verifyStudent/index' })
  },

  goToEditProfile() {
    wx.showModal({
      title: '提示',
      content: '编辑个人资料功能正在开发中',
      showCancel: false
    })
  },

  goToChangePassword() {
    wx.showModal({
      title: '提示',
      content: '修改密码功能正在开发中',
      showCancel: false
    })
  },

  goToBindStudentId() {
    wx.navigateTo({ url: '/pages/verifyStudent/index' })
  },

  goToBindPhone() {
    wx.showModal({
      title: '提示',
      content: '绑定手机号功能正在开发中',
      showCancel: false
    })
  },
})
