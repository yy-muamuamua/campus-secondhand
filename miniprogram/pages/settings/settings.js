// pages/settings/settings.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messageNotification: true, // 消息通知开关状态
    systemNotification: true  // 系统通知开关状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 加载用户设置
    this.loadUserSettings();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新加载设置
    this.loadUserSettings();
  },

  /**
   * 加载用户设置
   */
  loadUserSettings() {
    // 从本地存储获取设置
    const messageNotification = wx.getStorageSync('messageNotification') !== false;
    const systemNotification = wx.getStorageSync('systemNotification') !== false;
    
    this.setData({
      messageNotification,
      systemNotification
    });
  },

  /**
   * 切换消息通知
   */
  toggleMessageNotification(e) {
    const messageNotification = e.detail.value;
    this.setData({ messageNotification });
    // 保存到本地存储
    wx.setStorageSync('messageNotification', messageNotification);
  },

  /**
   * 切换系统通知
   */
  toggleSystemNotification(e) {
    const systemNotification = e.detail.value;
    this.setData({ systemNotification });
    // 保存到本地存储
    wx.setStorageSync('systemNotification', systemNotification);
  },

  /**
   * 跳转到编辑个人资料页面
   */
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  /**
   * 跳转到修改密码页面
   */
  goToChangePassword() {
    wx.showModal({
      title: '提示',
      content: '修改密码功能正在开发中',
      showCancel: false
    });
  },

  /**
   * 跳转到绑定邮箱页面
   */
  goToBindEmail() {
    wx.showModal({
      title: '提示',
      content: '绑定邮箱功能正在开发中',
      showCancel: false
    });
  },

  /**
   * 跳转到绑定手机号页面
   */
  goToBindPhone() {
    wx.showModal({
      title: '提示',
      content: '绑定手机号功能正在开发中',
      showCancel: false
    });
  },

  /**
   * 跳转到关于我们页面
   */
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '校园二手交易平台 v1.0.0\n\n致力于为大学生提供安全、便捷的二手交易服务。',
      showCancel: false
    });
  },

  /**
   * 跳转到意见反馈页面
   */
  goToFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '请将您的意见和建议发送至我们的邮箱：feedback@campus二手.com',
      showCancel: false
    });
  },

  /**
   * 跳转到隐私政策页面
   */
  goToPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们致力于保护您的隐私，所有个人信息将严格保密。',
      showCancel: false
    });
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的登录信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 跳转到登录页面或首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      }
    });
  }
})