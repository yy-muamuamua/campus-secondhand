// pages/orderList/index.js
Page({
  data: {
    activeTab: 'all',
    tabs: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'buy', name: '我买到的', count: 0 },
      { key: 'sell', name: '我卖出的', count: 0 }
    ],
    orders: [],
    page: 0,
    size: 10
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      activeTab: key,
      page: 0,
      orders: []
    }, () => {
      this.loadOrders()
    })
  },

  async loadOrders() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderList',
        data: {
          type: this.data.activeTab,
          page: this.data.page,
          size: this.data.size
        }
      })

      if (res.result.success) {
        this.setData({
          orders: res.result.data.orders
        })
      }
    } catch (error) {
      console.error('加载订单失败', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/orderDetail/index?id=${id}`
    })
  },

  async payOrder(e) {
    const order = e.currentTarget.dataset.order
    wx.showModal({
      title: '支付确认',
      content: `确认支付 ¥${(order.totalAmount / 100).toFixed(2)} 吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'createPayment',
              data: { orderId: order._id }
            })
            wx.showToast({ title: '支付成功', icon: 'success' })
            this.loadOrders()
          } catch (error) {
            wx.showToast({ title: '支付失败', icon: 'none' })
          }
        }
      }
    })
  },

  async cancelOrder(e) {
    const order = e.currentTarget.dataset.order
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
            this.loadOrders()
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
    const order = e.currentTarget.dataset.order
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
            this.loadOrders()
          } catch (error) {
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  goToReview(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/review/index?orderId=${order._id}`
    })
  },

  buyAgain(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/detail/detail?goodsId=${order.goodsId}`
    })
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

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
})