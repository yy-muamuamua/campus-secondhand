Page({
  data: {
    currentTab: 0,
    // 统计
    statistics: {},
    // 商品
    goodsList: [],
    goodsPage: 1,
    hasMoreGoods: true,
    loadingGoods: false,
    statusOptions: ['全部', '上架', '下架', '已售'],
    statusIndex: 0,
    // 用户
    userList: [],
    userPage: 1,
    hasMoreUsers: true,
    loadingUsers: false,
    // 留言
    messageList: [],
    messagePage: 1,
    hasMoreMessages: true,
    loadingMessages: false
  },

  onLoad() {
    this.loadStatistics()
    this.loadGoods(true)
    this.loadUsers(true)
    this.loadMessages(true)
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTab: index })
  },

  // 加载统计数据
  async loadStatistics() {
    const res = await wx.cloud.callFunction({ name: 'adminGetStatistics' })
    if (res.result.code === 0) {
      this.setData({ statistics: res.result.data })
    } else {
      wx.showToast({ title: res.result.message, icon: 'none' })
    }
  },

  // 加载商品列表
  async loadGoods(refresh = false) {
    if (this.data.loadingGoods) return
    if (!refresh && !this.data.hasMoreGoods) return

    this.setData({ loadingGoods: true })
    const page = refresh ? 1 : this.data.goodsPage
    const status = this.data.statusIndex === 0 ? '' : this.data.statusOptions[this.data.statusIndex].toLowerCase()

    const res = await wx.cloud.callFunction({
      name: 'adminGetGoodsList',
      data: { page, pageSize: 10, status }
    })
    if (res.result.code === 0) {
      const { list, total, hasMore } = res.result.data
      this.setData({
        goodsList: refresh ? list : this.data.goodsList.concat(list),
        goodsPage: refresh ? 2 : page + 1,
        hasMoreGoods: hasMore,
        loadingGoods: false
      })
    } else {
      wx.showToast({ title: res.result.message, icon: 'none' })
      this.setData({ loadingGoods: false })
    }
  },

  onStatusChange(e) {
    const index = e.detail.value
    this.setData({ statusIndex: index, goodsList: [], goodsPage: 1, hasMoreGoods: true }, () => {
      this.loadGoods(true)
    })
  },

  // 改变商品状态
  async changeGoodsStatus(e) {
    const goodsId = e.currentTarget.dataset.id
    const newStatus = e.currentTarget.dataset.status
    const res = await wx.cloud.callFunction({
      name: 'adminUpdateGoods',
      data: { goodsId, status: newStatus }
    })
    if (res.result.code === 0) {
      wx.showToast({ title: '操作成功', icon: 'success' })
      this.loadGoods(true)
    } else {
      wx.showToast({ title: res.result.message, icon: 'none' })
    }
  },

  async deleteGoods(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          const callRes = await wx.cloud.callFunction({
            name: 'adminDeleteGoods',
            data: { goodsId }
          })
          if (callRes.result.code === 0) {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadGoods(true)
          } else {
            wx.showToast({ title: callRes.result.message, icon: 'none' })
          }
        }
      }
    })
  },

  // 加载用户列表
  async loadUsers(refresh = false) {
    if (this.data.loadingUsers) return
    if (!refresh && !this.data.hasMoreUsers) return

    this.setData({ loadingUsers: true })
    const page = refresh ? 1 : this.data.userPage
    const res = await wx.cloud.callFunction({
      name: 'adminGetUserList',
      data: { page, pageSize: 10 }
    })
    if (res.result.code === 0) {
      const { list, total, hasMore } = res.result.data
      this.setData({
        userList: refresh ? list : this.data.userList.concat(list),
        userPage: refresh ? 2 : page + 1,
        hasMoreUsers: hasMore,
        loadingUsers: false
      })
    } else {
      wx.showToast({ title: res.result.message, icon: 'none' })
      this.setData({ loadingUsers: false })
    }
  },

  async toggleUserDisable(e) {
    const userId = e.currentTarget.dataset.id
    const disabled = e.currentTarget.dataset.disabled === true
    const res = await wx.cloud.callFunction({
      name: 'adminUpdateUser',
      data: { userId, disabled: !disabled }
    })
    if (res.result.code === 0) {
      wx.showToast({ title: '操作成功', icon: 'success' })
      this.loadUsers(true)
    } else {
      wx.showToast({ title: res.result.message, icon: 'none' })
    }
  },

  // 加载留言列表
  async loadMessages(refresh = false) {
    if (this.data.loadingMessages) return
    if (!refresh && !this.data.hasMoreMessages) return

    this.setData({ loadingMessages: true })
    const page = refresh ? 1 : this.data.messagePage
    const res = await wx.cloud.callFunction({
      name: 'adminGetMessageList',
      data: { page, pageSize: 10 }
    })
    if (res.result.code === 0) {
      const { list, total, hasMore } = res.result.data
      this.setData({
        messageList: refresh ? list : this.data.messageList.concat(list),
        messagePage: refresh ? 2 : page + 1,
        hasMoreMessages: hasMore,
        loadingMessages: false
      })
    } else {
      wx.showToast({ title: res.result.message, icon: 'none' })
      this.setData({ loadingMessages: false })
    }
  },

  async deleteMessage(e) {
    const messageId = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该留言吗？',
      success: async (res) => {
        if (res.confirm) {
          const callRes = await wx.cloud.callFunction({
            name: 'adminDeleteMessage',
            data: { messageId }
          })
          if (callRes.result.code === 0) {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadMessages(true)
          } else {
            wx.showToast({ title: callRes.result.message, icon: 'none' })
          }
        }
      }
    })
  }
})