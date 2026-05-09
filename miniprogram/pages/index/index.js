// pages/index/index.js
Page({
  data: {
    goodsList: [],          // 商品列表
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    categories: ['全部', '书籍', '电子产品', '生活用品', '其他'],
    currentCategory: '全部', // 当前选中的分类
    keyword: '',            // 搜索关键词
    showSearchInput: false,  // 是否显示搜索输入框
    // 新增排序与价格筛选相关字段
    sortBy: 'create_time',      // 排序字段
    sortOrder: 'desc',           // 排序方式
    sortOptions: [               // 排序选项列表
      { label: '最新发布', field: 'create_time', order: 'desc' },
      { label: '价格最低', field: 'price', order: 'asc' },
      { label: '价格最高', field: 'price', order: 'desc' },
      { label: '最热商品', field: 'views', order: 'desc' }
    ],
    sortIndex: 0,                // 当前选中的排序选项索引
    showSortPanel: false,        // 是否显示排序面板

    minPrice: '',                // 最低价输入
    maxPrice: '',                // 最高价输入
    showPriceFilter: false       // 是否显示价格筛选面板
  },

  onLoad() {
    this.loadGoods()
  },

  // 加载商品列表
  async loadGoods(refresh = false) {
    if (this.data.loading) return
    if (!refresh && !this.data.hasMore) return

    this.setData({ loading: true })

    const { page, pageSize, currentCategory, keyword } = this.data
    const category = currentCategory === '全部' ? '' : currentCategory

    try {
      const res = await wx.cloud.callFunction({
        name: 'getGoodsList',
        data: {
          page: refresh ? 1 : page,
          pageSize,
          category,
          keyword
        }
      })

      if (res.result.code === 0) {
        const { list, total, hasMore } = res.result.data
        this.setData({
          goodsList: refresh ? list : this.data.goodsList.concat(list),
          page: refresh ? 2 : page + 1,
          hasMore,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载失败', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadGoods(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadGoods()
    }
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      goodsList: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadGoods(true)
    })
  },

  // 显示搜索框
  showSearch() {
    this.setData({ showSearchInput: true })
  },

  // 隐藏搜索框
  hideSearch() {
    this.setData({ showSearchInput: false, keyword: '' }, () => {
      this.setData({ goodsList: [], page: 1, hasMore: true }, () => {
        this.loadGoods(true)
      })
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 执行搜索
  onSearch() {
    this.setData({ goodsList: [], page: 1, hasMore: true }, () => {
      this.loadGoods(true)
      this.setData({ showSearchInput: false })
    })
  },

  // 跳转到商品详情
  goToDetail(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?goodsId=${goodsId}`
    })
  },

  // 跳转到发布页面
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  },

  // 切换排序面板显示
  toggleSortPanel() {
    this.setData({ showSortPanel: !this.data.showSortPanel })
  },

  // 选择排序方式
  selectSort(e) {
    const index = e.currentTarget.dataset.index
    const option = this.data.sortOptions[index]
    this.setData({
      sortIndex: index,
      sortBy: option.field,
      sortOrder: option.order,
      showSortPanel: false,
      goodsList: [],
      page: 1,
      hasMore: true
    }, () => this.loadGoods(true))
  },

  // 切换价格筛选面板显示
  togglePriceFilter() {
    this.setData({ showPriceFilter: !this.data.showPriceFilter })
  },

  // 最低价输入
  onMinPriceInput(e) {
    this.setData({ minPrice: e.detail.value })
  },

  // 最高价输入
  onMaxPriceInput(e) {
    this.setData({ maxPrice: e.detail.value })
  },

  // 应用价格筛选
  applyPriceFilter() {
    this.setData({
      showPriceFilter: false,
      goodsList: [],
      page: 1,
      hasMore: true
    }, () => this.loadGoods(true))
  },

  // 清除价格筛选
  clearPriceFilter() {
    this.setData({
      minPrice: '',
      maxPrice: '',
      showPriceFilter: false,
      goodsList: [],
      page: 1,
      hasMore: true
    }, () => this.loadGoods(true))
  },
})