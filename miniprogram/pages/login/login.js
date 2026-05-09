Page({
  data: {
    email: '',
    password: '',
    isLoading: false
  },

  // 输入邮箱
  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    })
  },

  // 输入密码
  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 提交登录
  submitLogin() {
    const { email, password } = this.data

    if (!email || !password) {
      wx.showToast({
        title: '请填写邮箱和密码',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    // 调用云函数登录
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'login',
        email: email,
        password: password
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', {
          email: email,
          role: res.result.role || 'guest',
          _id: res.result.userId
        })
        
        // 跳转到个人中心
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: '登录失败，请检查邮箱和密码',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
      console.error('登录失败:', err)
    })
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  }
})