Page({
  data: {
    wechat: '',
    phone: '',
    loading: true,
    saving: false
  },

  onShow() {
    this.loadSettings()
  },

  async loadSettings() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      if (res.result.code === 0) {
        const info = res.result.data
        this.setData({
          wechat: info.contact_wechat || '',
          phone: info.contact_phone || '',
          loading: false
        })
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

  onWechatInput(e) {
    this.setData({ wechat: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  async save() {
    this.setData({ saving: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          contact_wechat: this.data.wechat,
          contact_phone: this.data.phone
        }
      })
      if (res.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        this.setData({ saving: false })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '保存失败', icon: 'none' })
      this.setData({ saving: false })
    }
  }
})