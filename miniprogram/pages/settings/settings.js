Page({
  data: {
    messageNotification: true,
    systemNotification: true,
    pushNotification: true,
    showDialog: false,
    dialogTitle: '',
    dialogContent: '',
    dialogButtons: [{ text: '确定' }],
    dialogAction: ''
  },

  onLoad(options) {
    console.log('设置页面加载')
    this.loadUserSettings()
  },

  onShow() {
    this.loadUserSettings()
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

  showDialog(title, content, buttons = [{ text: '确定' }]) {
    this.setData({
      showDialog: true,
      dialogTitle: title,
      dialogContent: content,
      dialogButtons: buttons
    })
  },

  onDialogTap(e) {
    const index = e.detail.index
    console.log('对话框点击:', index, 'dialogAction:', this.data.dialogAction)
    this.setData({ showDialog: false })
    
    if (this.data.dialogAction === 'logout' && index === 1) {
      console.log('执行退出登录')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('token')
      console.log('本地存储已清除')
      
      wx.reLaunch({
        url: '/pages/login/index',
        success: () => {
          console.log('已跳转到登录页')
        },
        fail: (err) => {
          console.error('跳转失败:', err)
          wx.showToast({ title: '跳转失败', icon: 'none' })
        }
      })
    }
  },

  loadUserSettings() {
    const messageNotification = wx.getStorageSync('messageNotification') !== false
    const systemNotification = wx.getStorageSync('systemNotification') !== false
    const pushNotification = wx.getStorageSync('pushNotification') !== false
    
    this.setData({
      messageNotification,
      systemNotification,
      pushNotification
    })
  },

  toggleMessageNotification(e) {
    const messageNotification = e.detail.value !== undefined ? e.detail.value : !this.data.messageNotification
    this.setData({ messageNotification })
    wx.setStorageSync('messageNotification', messageNotification)
    this.showToast(messageNotification ? '消息通知已开启' : '消息通知已关闭', 'success')
  },

  toggleMessageNotificationTap() {
    this.toggleMessageNotification({ detail: { value: !this.data.messageNotification } })
  },

  toggleSystemNotification(e) {
    const systemNotification = e.detail.value !== undefined ? e.detail.value : !this.data.systemNotification
    this.setData({ systemNotification })
    wx.setStorageSync('systemNotification', systemNotification)
    this.showToast(systemNotification ? '系统通知已开启' : '系统通知已关闭', 'success')
  },

  toggleSystemNotificationTap() {
    this.toggleSystemNotification({ detail: { value: !this.data.systemNotification } })
  },

  togglePushNotification(e) {
    const pushNotification = e.detail.value !== undefined ? e.detail.value : !this.data.pushNotification
    this.setData({ pushNotification })
    wx.setStorageSync('pushNotification', pushNotification)
    this.showToast(pushNotification ? '推送通知已开启' : '推送通知已关闭', 'success')
  },

  togglePushNotificationTap() {
    this.togglePushNotification({ detail: { value: !this.data.pushNotification } })
  },

  goToAbout() {
    this.showDialog('关于我们', '校园二手交易平台 v1.0.0\n\n致力于为大学生提供安全、便捷的二手交易服务。')
  },

  goToFeedback() {
    this.showDialog('意见反馈', '请将您的意见和建议发送至我们的邮箱：feedback@campus二手.com')
  },

  goToPrivacy() {
    this.showDialog('隐私政策', '我们致力于保护您的隐私，所有个人信息将严格保密。')
  },

  logout() {
    console.log('点击退出登录')
    this.setData({ dialogAction: 'logout' })
    this.showDialog('退出登录', '确定要退出登录吗？', [
      { text: '取消' },
      { text: '确定', type: 'primary' }
    ])
  }
})
