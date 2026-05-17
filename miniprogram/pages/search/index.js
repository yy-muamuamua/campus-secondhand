// pages/search/index.js
Page({
  data: {
    keyword: '',
    searchResults: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: options.keyword }, () => {
        this.search()
      })
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  handleSearch() {
    if (!this.data.keyword.trim()) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    this.setData({ searchResults: [], page: 1, hasMore: true }, () => {
      this.search()
    })
  },

  async search() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getGoodsList',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          keyword: this.data.keyword
        }
      })

      if (res.result.code === 0) {
        const { list, hasMore } = res.result.data
        this.setData({
          searchResults: this.data.page === 1 ? list : this.data.searchResults.concat(list),
          hasMore,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '搜索失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 }, () => {
        this.search()
      })
    }
  },

  goToDetail(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/index?goodsId=' + goodsId
    })
  },

  clearKeyword() {
    this.setData({ keyword: '', searchResults: [], page: 1, hasMore: true })
  }
})
