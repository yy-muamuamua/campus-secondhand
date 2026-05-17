Page({
  data: {
    email: '',
    password: '',
    isLoading: false,
    showPassword: false,
    agreed: false
  },

  bindEmailInput(e) {
    this.setData({ email: e.detail.value })
  },

  bindPasswordInput(e) {
    this.setData({ password: e.detail.value })
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

  submitLogin() {
    const { email, password, agreed } = this.data

    if (!agreed) {
      this.showErrorDialog('提示', '请先阅读并同意用户协议和隐私政策')
      return
    }

    if (!email || !password) {
      this.showErrorDialog('提示', '请填写邮箱和密码')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      this.showErrorDialog('提示', '请输入有效的邮箱地址')
      return
    }

    const cleanEmail = email.trim()
    this.setData({ isLoading: true })

    console.log('=== 前端登录请求 ===')
    console.log('原始邮箱:', email)
    console.log('清理后邮箱:', cleanEmail)
    console.log('密码:', password)

    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'login',
        email: cleanEmail,
        password: password
      }
    }).then(res => {
      console.log('login 云函数完整返回:', res)
      this.setData({ isLoading: false })
      if (res.result.success) {
        this.showToast('登录成功', 'success')

        const userInfo = res.result.userInfo || {
          email: cleanEmail,
          role: 'user',
          _id: res.result.userId
        }
        wx.setStorageSync('userInfo', userInfo)
        console.log('保存用户信息:', userInfo)

        // 检查是否已绑定学号
        setTimeout(() => {
          if (!userInfo.email_verified || !userInfo.student_id) {
            console.log('用户未绑定学号，跳转到认证页面')
            wx.redirectTo({
              url: '/pages/verifyStudent/index'
            })
          } else {
            console.log('用户已绑定学号，跳转到我的页面')
            wx.switchTab({
              url: '/pages/my/index'
            })
          }
        }, 1500)
      } else {
        console.error('登录失败，详细信息:', res.result)
        let errorMsg = res.result.message || '请检查邮箱和密码'
        if (res.result.debug) {
          errorMsg += '\n\n调试信息:\n输入邮箱: ' + res.result.debug.inputEmail + 
                      '\n数据库邮箱: ' + JSON.stringify(res.result.debug.allEmails)
        }
        this.showErrorDialog('登录失败', errorMsg)
      }
    }).catch(err => {
      console.error('登录异常:', err)
      this.setData({ isLoading: false })
      this.showErrorDialog('错误', '登录失败，请检查网络后重试')
    })
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/index'
    })
  }
})
