// pages/review/index.js
Page({
  data: {
    orderId: '',
    order: null,
    productRating: 0,
    sellerRating: 0,
    content: '',
    images: []
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId }, () => {
        this.loadOrder()
      })
    }
  },

  async loadOrder() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: this.data.orderId }
      })

      if (res.result.success) {
        this.setData({ order: res.result.data })
      }
    } catch (error) {
      console.error('加载订单失败', error)
    }
  },

  setProductRating(e) {
    const rating = e.currentTarget.dataset.rating
    this.setData({ productRating: rating })
  },

  setSellerRating(e) {
    const rating = e.currentTarget.dataset.rating
    this.setData({ sellerRating: rating })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage() {
    const remaining = 9 - this.data.images.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' })
      return
    }

    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = this.data.images.concat(res.tempFilePaths)
        this.setData({ images: newImages })
      }
    })
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.slice()
    images.splice(index, 1)
    this.setData({ images })
  },

  async submitReview() {
    if (this.data.productRating === 0 || this.data.sellerRating === 0) {
      wx.showToast({ title: '请完成评分', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'addReview',
        data: {
          orderId: this.data.orderId,
          productRating: this.data.productRating,
          sellerRating: this.data.sellerRating,
          content: this.data.content,
          images: this.data.images
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({ title: '评价成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: res.result.message || '评价失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('提交评价失败', error)
      wx.showToast({ title: '评价失败', icon: 'none' })
    }
  },

  goToGoods(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/detail?goodsId=' + goodsId
    })
  },

  getRatingText(rating) {
    if (rating === 0) return '请评分'
    if (rating <= 2) return '差'
    if (rating === 3) return '一般'
    if (rating === 4) return '好'
    return '非常好'
  }
})