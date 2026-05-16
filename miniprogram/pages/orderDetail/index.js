// pages/orderDetail/index.js
Page({
  data: {
    order: null,
    seller: null,
    formattedTotalAmount: '0.00'
  },

  onLoad(options) {
    if (options.id) {
      this.loadOrder(options.id)
    }
  },

  async loadOrder(orderId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId }
      })

      if (res.result.success) {
        const order = res.result.data
        const formattedTotalAmount = (order.totalAmount / 100).toFixed(2)
        this.setData({ 
          order: order,
          formattedTotalAmount: formattedTotalAmount
        }, () => {
          this.loadSeller(res.result.data.sellerOpenid)
        })
      }
    } catch (error) {
      console.error('加载订单失败', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadSeller(openid) {
    try {
      const userRes = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: { openid }
      })

      if (userRes.result.success) {
        this.setData({ seller: userRes.result.data })
      }
    } catch (error) {
      console.error('加载卖家信息失败', error)
    }
  },

  goToGoods(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/detail?goodsId=' + goodsId
    })
  },

  goToChat(e) {
    const openid = e.currentTarget.dataset.openid
    wx.navigateTo({
      url: '/pages/chat/index?targetOpenid=' + openid
    })
  },

  async payOrder(e) {
    const order = this.data.order
    try {
      await wx.cloud.callFunction({
        name: 'createPayment',
        data: { orderId: order._id }
      })
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.loadOrder(order._id)
    } catch (error) {
      wx.showToast({ title: '支付失败', icon: 'none' })
    }
  },

  async cancelOrder(e) {
    const order = this.data.order
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'cancelOrder',
              data: { orderId: order._id, reason: '买家主动取消' }
            })
            wx.showToast({ title: '取消成功', icon: 'success' })
            this.loadOrder(order._id)
          } catch (error) {
            wx.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  },

  remindSeller(e) {
    wx.showToast({ title: '已提醒卖家', icon: 'success' })
  },

  async confirmReceipt(e) {
    const order = this.data.order
    wx.showModal({
      title: '确认收货',
      content: '请确认您已经收到商品',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'confirmReceipt',
              data: { orderId: order._id }
            })
            wx.showToast({ title: '收货成功', icon: 'success' })
            this.loadOrder(order._id)
          } catch (error) {
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  goToReview(e) {
    const order = this.data.order
    wx.navigateTo({
      url: '/pages/review/index?orderId=' + order._id
    })
  },

  buyAgain(e) {
    const order = this.data.order
    wx.navigateTo({
      url: '/pages/detail/detail?goodsId=' + order.goodsId
    })
  },

  applyRefund(e) {
    const order = this.data.order
    wx.showModal({
      title: '申请退款',
      content: '确定要申请退款吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'applyRefund',
              data: { orderId: order._id, reason: '买家申请退款' }
            })
            wx.showToast({ title: '退款申请已提交', icon: 'success' })
            this.loadOrder(order._id)
          } catch (error) {
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  getStatusIcon(status) {
    const icons = {
      pending_payment: '⏳',
      paid: '💳',
      shipped: '📦',
      received: '✅',
      completed: '🎉',
      cancelled: '❌',
      refunding: '🔄',
      refunded: '💰'
    }
    return icons[status] || '📄'
  },

  getStatusText(status) {
    const map = {
      pending_payment: '待付款',
      paid: '待发货',
      shipped: '待收货',
      received: '待评价',
      completed: '已完成',
      cancelled: '已取消',
      refunding: '退款中',
      refunded: '已退款'
    }
    return map[status] || status
  },

  getStatusDesc(status) {
    const map = {
      pending_payment: '请在24小时内完成付款',
      paid: '等待卖家发货',
      shipped: '商品已发出，请留意物流信息',
      received: '请及时评价商品',
      completed: '感谢您的使用',
      cancelled: '订单已取消',
      refunding: '正在处理退款',
      refunded: '退款已完成'
    }
    return map[status] || ''
  },

  getLogisticsStatus(status) {
    const map = {
      pending: '待发货',
      in_transit: '运输中',
      delivered: '已送达'
    }
    return map[status] || status
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes
  },

  formatPrice(price) {
    return (price / 100).toFixed(2)
  }
})