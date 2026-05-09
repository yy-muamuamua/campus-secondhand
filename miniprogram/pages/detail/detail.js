Page({
  data: {
    goodsId: '',
    goodsInfo: null,
    sellerInfo: null,
    loading: true,
    isFavorited: false,  // 是否已收藏
    isSeller: false,
    messages: [],          // 留言列表
    messageContent: '',    // 新留言内容
    replyContent: {},      // 临时存储回复内容（按留言ID）
    showReplyInput: null   // 当前展开回复框的留言ID
  },

  onLoad(options) {
    if (options.goodsId) {
      this.setData({ goodsId: options.goodsId }, () => {
        this.loadDetail()
        this.checkFavorite()  // 检查收藏状态
      })
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
    this.loadMessages()
  },

  // 检查当前商品是否已被当前用户收藏
  async checkFavorite() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'checkFavorite',
        data: { goodsId: this.data.goodsId }
      })
      if (res.result.code === 0) {
        this.setData({ isFavorited: res.result.data })
      }
    } catch (err) {
      console.error(err)
    }
  },

  async toggleFavorite() {
    const { isFavorited, goodsId } = this.data
    const action = isFavorited ? 'removeFavorite' : 'addFavorite'
    try {
      const res = await wx.cloud.callFunction({
        name: action,
        data: { goodsId }
      })
      if (res.result.code === 0) {
        this.setData({ isFavorited: !isFavorited })
        wx.showToast({ title: isFavorited ? '已取消收藏' : '收藏成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  async markAsSold() {
    wx.showModal({
      title: '提示',
      content: '确定将该商品标记为已售吗？标记后商品将不再接受咨询。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callRes = await wx.cloud.callFunction({
              name: 'updateGoods',
              data: {
                goodsId: this.data.goodsId,
                status: 'sold'
              }
            })
            if (callRes.result.code === 0) {
              wx.showToast({ title: '已标记为已售', icon: 'success' })
              // 更新本地状态，隐藏按钮
              this.setData({
                'goodsInfo.status': 'sold'
              })
            } else {
              wx.showToast({ title: callRes.result.message, icon: 'none' })
            }
          } catch (err) {
            console.error(err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 加载留言
  async loadMessages() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMessagesByGoods',
        data: { goodsId: this.data.goodsId }
      })
      if (res.result.code === 0) {
        this.setData({ messages: res.result.data })
      }
    } catch (err) {
      console.error(err)
    }
  },

   // 留言输入
   onMessageInput(e) {
    this.setData({ messageContent: e.detail.value })
  },

  // 提交留言
  async submitMessage() {
    const content = this.data.messageContent.trim()
    if (!content) {
      wx.showToast({ title: '请输入留言', icon: 'none' })
      return
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'addMessage',
        data: {
          goodsId: this.data.goodsId,
          content
        }
      })
      if (res.result.code === 0) {
        wx.showToast({ title: '留言成功', icon: 'success' })
        this.setData({ messageContent: '' })
        this.loadMessages() // 刷新留言
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '留言失败', icon: 'none' })
    }
  },

  // 切换回复框显示
  toggleReply(e) {
    const messageId = e.currentTarget.dataset.id
    this.setData({
      showReplyInput: this.data.showReplyInput === messageId ? null : messageId,
      [`replyContent.${messageId}`]: '' // 清空对应回复内容
    })
  },

  // 回复输入
  onReplyInput(e) {
    const messageId = e.currentTarget.dataset.id
    this.setData({
      [`replyContent.${messageId}`]: e.detail.value
    })
  },

  // 提交回复
  async submitReply(e) {
    const messageId = e.currentTarget.dataset.id
    const reply = this.data.replyContent[messageId]?.trim()
    if (!reply) {
      wx.showToast({ title: '请输入回复', icon: 'none' })
      return
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'replyMessage',
        data: { messageId, reply }
      })
      if (res.result.code === 0) {
        wx.showToast({ title: '回复成功', icon: 'success' })
        this.setData({ showReplyInput: null })
        this.loadMessages() // 刷新
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '回复失败', icon: 'none' })
    }
  },
  
  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getGoodsDetail',
        data: { goodsId: this.data.goodsId }
      })
      if (res.result.code === 0) {
        // const userRes = await wx.cloud.callFunction({ name: 'getUserInfo' })
        // const currentUserId = userRes.result.data?._id 
        const idRes = await wx.cloud.callFunction({ name: 'getCurrentUserId' })
        const currentUserId = idRes.result.data
        const isSeller = (currentUserId === goodsRes.data.seller_id)
        this.setData({
          goodsInfo: res.result.data,
          sellerInfo: res.result.data.seller,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '网络错误', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  contactSeller() {
    const wechat = this.data.sellerInfo?.contact_wechat
    if (wechat) {
      wx.setClipboardData({
        data: wechat,
        success: () => {
          wx.showToast({ title: '已复制微信号', icon: 'success' })
        }
      })
    } else {
      wx.showToast({ title: '卖家未设置微信号', icon: 'none' })
    }
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.goodsInfo.images
    wx.previewImage({
      current: urls[index],
      urls
    })
  },

  formatTime(dateStr) {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
  }
})