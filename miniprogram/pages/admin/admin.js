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
    console.log('=== 管理后台加载 ===')
    this.loadStatistics()
    this.loadGoods(true)
    this.loadUsers(true)
    this.loadMessages(true)
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    console.log('切换到 tab:', index)
    this.setData({ currentTab: index })
    
    // 根据 tab 决定加载什么数据
    if (index === 1 && this.data.goodsList.length === 0 && !this.data.loadingGoods) {
      console.log('加载商品数据')
      this.loadGoods(true)
    } else if (index === 2 && this.data.userList.length === 0 && !this.data.loadingUsers) {
      console.log('加载用户数据')
      this.loadUsers(true)
    } else if (index === 3 && this.data.messageList.length === 0 && !this.data.loadingMessages) {
      console.log('加载留言数据')
      this.loadMessages(true)
    }
  },

  // 加载统计数据
  async loadStatistics() {
    console.log('加载统计...')
    try {
      const res = await wx.cloud.callFunction({ name: 'adminGetStatistics' })
      console.log('统计返回:', res)
      if (res.result && res.result.code === 0) {
        this.setData({ statistics: res.result.data })
        console.log('统计数据:', res.result.data)
      } else {
        const msg = res.result?.message || '获取统计失败'
        console.error(msg)
        wx.showToast({ title: msg, icon: 'none' })
      }
    } catch (err) {
      console.error('统计请求异常:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  // 加载商品列表
  async loadGoods(refresh = false) {
    if (this.data.loadingGoods) return
    if (!refresh && !this.data.hasMoreGoods) return

    console.log('加载商品列表, refresh:', refresh)
    this.setData({ loadingGoods: true })
    
    try {
      const page = refresh ? 1 : this.data.goodsPage
      const status = this.data.statusIndex === 0 ? '' : this.data.statusOptions[this.data.statusIndex].toLowerCase()

      const res = await wx.cloud.callFunction({
        name: 'adminGetGoodsList',
        data: { page, pageSize: 10, status }
      })
      console.log('商品列表返回:', res)

      if (res.result && res.result.code === 0) {
        const { list, total, hasMore } = res.result.data
        console.log('商品数据:', list)
        this.setData({
          goodsList: refresh ? list : this.data.goodsList.concat(list),
          goodsPage: refresh ? 2 : page + 1,
          hasMoreGoods: hasMore,
          loadingGoods: false
        })
      } else {
        const msg = res.result?.message || '获取商品列表失败'
        console.error(msg)
        wx.showToast({ title: msg, icon: 'none' })
        this.setData({ loadingGoods: false })
      }
    } catch (err) {
      console.error('商品列表请求异常:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
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
    console.log('修改商品状态:', goodsId, newStatus)

    try {
      const res = await wx.cloud.callFunction({
        name: 'adminUpdateGoods',
        data: { goodsId, status: newStatus }
      })
      console.log('更新返回:', res)

      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '操作成功', icon: 'success' })
        this.loadGoods(true)
      } else {
        const msg = res.result?.message || '操作失败'
        wx.showToast({ title: msg, icon: 'none' })
      }
    } catch (err) {
      console.error('更新商品异常:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  async deleteGoods(e) {
    const goodsId = e.currentTarget.dataset.id
    console.log('删除商品:', goodsId)

    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callRes = await wx.cloud.callFunction({
              name: 'adminDeleteGoods',
              data: { goodsId }
            })
            console.log('删除返回:', callRes)

            if (callRes.result && callRes.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadGoods(true)
            } else {
              const msg = callRes.result?.message || '删除失败'
              wx.showToast({ title: msg, icon: 'none' })
            }
          } catch (err) {
            console.error('删除商品异常:', err)
            wx.showToast({ title: '网络错误', icon: 'none' })
          }
        }
      }
    })
  },

  // 加载用户列表
  async loadUsers(refresh = false) {
    if (this.data.loadingUsers) return
    if (!refresh && !this.data.hasMoreUsers) return

    console.log('加载用户列表, refresh:', refresh)
    this.setData({ loadingUsers: true })

    try {
      const page = refresh ? 1 : this.data.userPage
      const res = await wx.cloud.callFunction({
        name: 'adminGetUserList',
        data: { page, pageSize: 10 }
      })
      console.log('用户列表返回:', res)

      if (res.result && res.result.code === 0) {
        const { list, total, hasMore } = res.result.data
        console.log('用户数据:', list)
        this.setData({
          userList: refresh ? list : this.data.userList.concat(list),
          userPage: refresh ? 2 : page + 1,
          hasMoreUsers: hasMore,
          loadingUsers: false
        })
      } else {
        const msg = res.result?.message || '获取用户列表失败'
        console.error(msg)
        wx.showToast({ title: msg, icon: 'none' })
        this.setData({ loadingUsers: false })
      }
    } catch (err) {
      console.error('用户列表请求异常:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
      this.setData({ loadingUsers: false })
    }
  },

  async toggleUserDisable(e) {
    const userId = e.currentTarget.dataset.id
    const disabled = e.currentTarget.dataset.disabled === true
    console.log('切换用户状态:', userId, 'disabled:', disabled)

    try {
      const res = await wx.cloud.callFunction({
        name: 'adminUpdateUser',
        data: { userId, disabled: !disabled }
      })
      console.log('更新用户返回:', res)

      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '操作成功', icon: 'success' })
        this.loadUsers(true)
      } else {
        const msg = res.result?.message || '操作失败'
        wx.showToast({ title: msg, icon: 'none' })
      }
    } catch (err) {
      console.error('更新用户异常:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  // 加载留言列表
  async loadMessages(refresh = false) {
    if (this.data.loadingMessages) return
    if (!refresh && !this.data.hasMoreMessages) return

    console.log('加载留言列表, refresh:', refresh)
    this.setData({ loadingMessages: true })

    try {
      const page = refresh ? 1 : this.data.messagePage
      const res = await wx.cloud.callFunction({
        name: 'adminGetMessageList',
        data: { page, pageSize: 10 }
      })
      console.log('留言列表返回:', res)

      if (res.result && res.result.code === 0) {
        const { list, total, hasMore } = res.result.data
        console.log('留言数据:', list)
        this.setData({
          messageList: refresh ? list : this.data.messageList.concat(list),
          messagePage: refresh ? 2 : page + 1,
          hasMoreMessages: hasMore,
          loadingMessages: false
        })
      } else {
        const msg = res.result?.message || '获取留言列表失败'
        console.error(msg)
        wx.showToast({ title: msg, icon: 'none' })
        this.setData({ loadingMessages: false })
      }
    } catch (err) {
      console.error('留言列表请求异常:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
      this.setData({ loadingMessages: false })
    }
  },

  async deleteMessage(e) {
    const messageId = e.currentTarget.dataset.id
    console.log('删除留言:', messageId)

    wx.showModal({
      title: '提示',
      content: '确定删除该留言吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callRes = await wx.cloud.callFunction({
              name: 'adminDeleteMessage',
              data: { messageId }
            })
            console.log('删除留言返回:', callRes)

            if (callRes.result && callRes.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadMessages(true)
            } else {
              const msg = callRes.result?.message || '删除失败'
              wx.showToast({ title: msg, icon: 'none' })
            }
          } catch (err) {
            console.error('删除留言异常:', err)
            wx.showToast({ title: '网络错误', icon: 'none' })
          }
        }
      }
    })
  }
})
