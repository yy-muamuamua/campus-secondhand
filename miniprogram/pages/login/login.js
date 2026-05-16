Page({
  data: {
    email: '',
    password: '',
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

  showToast(message, icon = 'none') {
    const toast = this.selectComponent('#toast')
    toast.show({
      msg: message,
      icon: icon === 'success' ? 'success' : 'warn',
      duration: icon === 'success' ? 1500 : 2000
    })
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

  submitLogin() {
    const { email, password } = this.data

    if (!email || !password) {
      this.showErrorDialog('提示', '请填写邮箱和密码')
      return
    }

    this.setData({ isLoading: true })

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
        this.showToast('登录成功', 'success')

        wx.setStorageSync('userInfo', {
          email: email,
          role: res.result.role || 'guest',
          _id: res.result.userId
        })

        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        }, 1500)
      } else {
        this.showErrorDialog('登录失败', '请检查邮箱和密码')
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      this.showErrorDialog('错误', '登录失败，请检查网络后重试')
      console.error('登录失败:', err)
    })
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  }
})
