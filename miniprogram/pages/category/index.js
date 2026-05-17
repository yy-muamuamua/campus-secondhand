// pages/category/index.js
Page({
  data: {
    categories: ['全部', '书籍', '电子产品', '生活用品', '其他'],
    currentCategory: '全部',
    goodsList: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    this.loadGoods()
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      goodsList: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadGoods()
    })
  },

  async loadGoods() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    const category = this.data.currentCategory === '全部' ? '' : this.data.currentCategory

    try {
      const res = await wx.cloud.callFunction({
        name: 'getGoodsList',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          category
        }
      })

      if (res.result.code === 0) {
        const { list, hasMore } = res.result.data
        this.setData({
          goodsList: this.data.page === 1 ? list : this.data.goodsList.concat(list),
          hasMore,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 }, () => {
        this.loadGoods()
      })
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true }, () => {
      this.loadGoods()
      wx.stopPullDownRefresh()
    })
  },

  goToDetail(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/index?goodsId=' + goodsId
    })
  }
})
