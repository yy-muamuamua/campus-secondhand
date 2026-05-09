Page({
  data: {
    goodsList: [],
    loading: true
  },

  onShow() {
    this.loadFavorites()
  },

  async loadFavorites() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyFavorites',
        data: {}
      })
      if (res.result.code === 0) {
        this.setData({ goodsList: res.result.data, loading: false })
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

  // 跳转到商品详情
  goToDetail(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?goodsId=${goodsId}` })
  }
})