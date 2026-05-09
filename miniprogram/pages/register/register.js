Page({
  data: {
    email: '',
    password: '',
    verificationCode: '',
    countdown: 0,
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

  // 输入验证码
  bindVerificationCodeInput(e) {
    this.setData({
      verificationCode: e.detail.value
    })
  },

  // 发送验证码
  sendVerificationCode() {
    const { email } = this.data

    if (!email) {
      wx.showToast({
        title: '请输入邮箱',
        icon: 'none'
      })
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      wx.showToast({
        title: '请输入有效的邮箱地址',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    // 调用云函数发送验证码
    wx.cloud.callFunction({
      name: 'sendVerificationCode',
      data: {
        email: email,
        type: 'registration'
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        })
        // 开始倒计时
        this.startCountdown()
      } else {
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      })
      console.error('发送验证码失败:', err)
    })
  },

  // 开始倒计时
  startCountdown() {
    let countdown = 60
    this.setData({ countdown })
    
    const timer = setInterval(() => {
      countdown--
      this.setData({ countdown })
      
      if (countdown <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  },

  // 提交注册
  submitRegister() {
    const { email, password, verificationCode } = this.data

    if (!email || !password || !verificationCode) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    // 调用云函数注册
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'register',
        email: email,
        password: password,
        code: verificationCode
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        })
        
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', {
          email: email,
          role: 'guest',
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
          title: '注册失败，请重试',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'none'
      })
      console.error('注册失败:', err)
    })
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  }
})