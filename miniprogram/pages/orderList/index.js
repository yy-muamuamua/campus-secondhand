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
    size: 10,
    showDialog: false,
    dialogTitle: '',
    dialogContent: '',
    dialogButtons: [{ text: '确定' }]
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  showToast(message, icon = 'none') {
    const toast = this.selectComponent('#toast')
    if (toast) {
      toast.show({
        msg: message,
        icon: icon === 'success' ? 'success' : 'warn',
        duration: icon === 'success' ? 1500 : 2000
      })
    }
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
        let orders = res.result.data.orders
        orders.forEach((order) => {
          order.formattedAmount = (order.totalAmount / 100).toFixed(2)
        })
        this.setData({
          orders: orders
        })
      }
    } catch (error) {
      console.error('加载订单失败', error)
      this.showToast('加载失败', 'warn')
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/orderDetail/index?id=' + id
    })
  },

  async payOrder(e) {
    const order = e.currentTarget.dataset.order
    this.setData({
      showDialog: true,
      dialogTitle: '支付确认',
      dialogContent: '确认支付 ¥' + (order.totalAmount / 100).toFixed(2) + ' 吗？',
      dialogButtons: [
        { text: '取消' },
        { text: '确认支付', type: 'primary' }
      ],
      currentOrder: order,
      dialogAction: 'pay'
    })
  },

  async cancelOrder(e) {
    const order = e.currentTarget.dataset.order
    this.setData({
      showDialog: true,
      dialogTitle: '取消订单',
      dialogContent: '确定要取消这个订单吗？',
      dialogButtons: [
        { text: '否' },
        { text: '是', type: 'primary' }
      ],
      currentOrder: order,
      dialogAction: 'cancel'
    })
  },

  async confirmReceipt(e) {
    const order = e.currentTarget.dataset.order
    this.setData({
      showDialog: true,
      dialogTitle: '确认收货',
      dialogContent: '请确认您已经收到商品',
      dialogButtons: [
        { text: '否' },
        { text: '是', type: 'primary' }
      ],
      currentOrder: order,
      dialogAction: 'confirm'
    })
  },

  onDialogButtonTap(e) {
    const index = e.detail.index
    const action = this.data.dialogAction
    const order = this.data.currentOrder

    this.setData({ showDialog: false })

    if (index === 0) return

    if (action === 'pay') {
      this.doPayOrder(order)
    } else if (action === 'cancel') {
      this.doCancelOrder(order)
    } else if (action === 'confirm') {
      this.doConfirmReceipt(order)
    }
  },

  async doPayOrder(order) {
    try {
      await wx.cloud.callFunction({
        name: 'createPayment',
        data: { orderId: order._id }
      })
      this.showToast('支付成功', 'success')
      this.loadOrders()
    } catch (error) {
      this.showToast('支付失败', 'warn')
    }
  },

  async doCancelOrder(order) {
    try {
      await wx.cloud.callFunction({
        name: 'cancelOrder',
        data: { orderId: order._id, reason: '买家主动取消' }
      })
      this.showToast('取消成功', 'success')
      this.loadOrders()
    } catch (error) {
      this.showToast('取消失败', 'warn')
    }
  },

  async doConfirmReceipt(order) {
    try {
      await wx.cloud.callFunction({
        name: 'confirmReceipt',
        data: { orderId: order._id }
      })
      this.showToast('收货成功', 'success')
      this.loadOrders()
    } catch (error) {
      this.showToast('操作失败', 'warn')
    }
  },

  remindSeller(e) {
    this.showToast('已提醒卖家', 'success')
  },

  goToReview(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: '/pages/review/index?orderId=' + order._id
    })
  },

  buyAgain(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: '/pages/detail/index?goodsId=' + order.goodsId
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
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return month + '-' + day
  }
})
