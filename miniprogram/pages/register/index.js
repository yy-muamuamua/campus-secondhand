Page({
  data: {
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    countdown: 0,
    isLoading: false,
    showPassword: false,
    agreed: false,
    passwordStrength: 'weak',
    passwordStrengthText: '弱'
  },

  bindEmailInput(e) {
    this.setData({ email: e.detail.value })
  },

  bindPasswordInput(e) {
    const password = e.detail.value
    this.setData({ password })
    this.calculatePasswordStrength(password)
  },

  bindConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  bindVerificationCodeInput(e) {
    this.setData({ verificationCode: e.detail.value })
  },

  calculatePasswordStrength(password) {
    let strength = 'weak'
    let text = '弱'

    if (password.length >= 6) {
      if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
        strength = 'strong'
        text = '强'
      } else if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) {
        strength = 'medium'
        text = '中'
      } else {
        strength = 'weak'
        text = '弱'
      }
    }

    this.setData({
      passwordStrength: strength,
      passwordStrengthText: text
    })
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  onAgreementChange(e) {
    this.setData({ agreed: e.detail.value.includes('agreed') })
  },

  showUserAgreement(e) {
    e.stopPropagation()
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用校园二手交易平台！请仔细阅读并遵守以下用户协议：\n1. 请使用真实信息注册账号\n2. 不得发布违法违规商品\n3. 交易时请注意个人财产安全\n4. 遵守平台交易规则\n\n阅读并同意后请勾选同意继续使用。',
      showCancel: false
    })
  },

  showPrivacyPolicy(e) {
    e.stopPropagation()
    wx.showModal({
      title: '隐私政策',
      content: '我们非常重视您的隐私保护：\n1. 我们仅收集必要的用户信息\n2. 您的个人信息将被安全存储\n3. 我们不会向第三方泄露您的信息\n4. 您可以随时查看和修改您的信息\n\n阅读并同意后请勾选同意继续使用。',
      showCancel: false
    })
  },

  showToast(message, icon = 'none') {
    wx.showToast({
      title: message,
      icon: icon === 'success' ? 'success' : 'none',
      duration: 2000
    })
  },

  showErrorDialog(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    })
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

    console.log('调用 sendVerificationCode 云函数')
    
    wx.cloud.callFunction({
      name: 'sendVerificationCode',
      data: {
        email: email,
        type: 'registration'
      }
    }).then(res => {
      console.log('sendVerificationCode 返回:', res)
      this.setData({ isLoading: false })
      if (res.result.success) {
        this.showToast(res.result.message || '验证码已发送', 'success')
        this.startCountdown()
      } else {
        this.showErrorDialog('发送失败', res.result.message || '请重试')
      }
    }).catch(err => {
      console.error('sendVerificationCode 异常:', err)
      this.setData({ isLoading: false })
      this.showErrorDialog('错误', '发送失败，请检查网络后重试')
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
    const { email, password, confirmPassword, verificationCode, agreed } = this.data

    if (!agreed) {
      this.showErrorDialog('提示', '请先阅读并同意用户协议和隐私政策')
      return
    }

    if (!email || !password || !confirmPassword || !verificationCode) {
      this.showErrorDialog('提示', '请填写完整信息')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      this.showErrorDialog('提示', '请输入有效的邮箱地址')
      return
    }

    if (password.length < 6) {
      this.showErrorDialog('提示', '密码长度至少6位')
      return
    }

    if (password !== confirmPassword) {
      this.showErrorDialog('提示', '两次输入的密码不一致')
      return
    }

    this.setData({ isLoading: true })

    console.log('调用 login 云函数进行注册')

    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'register',
        email: email,
        password: password,
        code: verificationCode
      }
    }).then(res => {
      console.log('login (register) 返回:', res)
      this.setData({ isLoading: false })
      if (res.result.success) {
        this.showToast('注册成功', 'success')

        const userInfo = res.result.userInfo || {
          email: email,
          role: 'user',
          _id: res.result.userId
        }
        wx.setStorageSync('userInfo', userInfo)
        console.log('保存用户信息:', userInfo)

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/my/index'
          })
        }, 1500)
      } else {
        this.showErrorDialog('注册失败', res.result.message || '请重试')
      }
    }).catch(err => {
      console.error('注册异常:', err)
      this.setData({ isLoading: false })
      this.showErrorDialog('错误', '注册失败，请检查网络后重试')
    })
  },

  goToLogin() {
    wx.navigateBack()
  }
})
