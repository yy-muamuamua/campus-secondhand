Page({
  data: {
    email: '',
    password: '',
    verificationCode: '',
    countdown: 0,
    isLoading: false,
    showDialog: false,
    dialogTitle: '',
    dialogContent: '',
    dialogButtons: [{ text: '确定' }]
  },

  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    })
  },

  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  bindVerificationCodeInput(e) {
    this.setData({
      verificationCode: e.detail.value
    })
  },

  showToast(message, icon = 'none') {
    const toast = this.selectComponent('#toast')
    if (toast) {
      toast.show({
        msg: message,
        icon: icon === 'success' ? 'success' : 'warn',
        duration: icon === 'success' ? 1500 : 2000
      })
    }
  },

  showErrorDialog(title, content) {
    this.setData({
      showDialog: true,
      dialogTitle: title,
      dialogContent: content,
      dialogButtons: [{ text: '我知道了' }]
    })
  },

  onDialogTap() {
    this.setData({ showDialog: false })
  },

  sendVerificationCode() {
    const { email } = this.data

    if (!email) {
      this.showErrorDialog('提示', '请输入邮箱')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      this.showErrorDialog('提示', '请输入有效的邮箱地址')
      return
    }

    this.setData({ isLoading: true })

    wx.cloud.callFunction({
      name: 'sendVerificationCode',
      data: {
        email: email,
        type: 'registration'
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        this.showToast('验证码已发送', 'success')
        this.startCountdown()
      } else {
        this.showErrorDialog('发送失败', res.result.message || '请重试')
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      this.showErrorDialog('错误', '发送失败，请检查网络后重试')
      console.error('发送验证码失败:', err)
    })
  },

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

  submitRegister() {
    const { email, password, verificationCode } = this.data

    if (!email || !password || !verificationCode) {
      this.showErrorDialog('提示', '请填写完整信息')
      return
    }

    if (password.length < 6) {
      this.showErrorDialog('提示', '密码长度至少6位')
      return
    }

    this.setData({ isLoading: true })

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
        this.showToast('注册成功', 'success')

        wx.setStorageSync('userInfo', {
          email: email,
          role: 'guest',
          _id: res.result.userId
        })

        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        }, 1500)
      } else {
        this.showErrorDialog('注册失败', res.result.message || '请重试')
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      this.showErrorDialog('错误', '注册失败，请检查网络后重试')
      console.error('注册失败:', err)
    })
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  }
})
