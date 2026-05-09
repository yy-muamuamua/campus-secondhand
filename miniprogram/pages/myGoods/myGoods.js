Page({
  data: {
    goodsList: [],
    loading: true
  },

  onShow() {
    this.loadMyGoods()
  },

  async loadMyGoods() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyGoods',
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

  // 跳转到编辑页面（暂留空，后续开发编辑页）
  goToEdit(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/editGoods/editGoods?goodsId=${goodsId}`
    })
  },

  // 下架商品
  async offShelf(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定下架该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callRes = await wx.cloud.callFunction({
              name: 'updateGoods',
              data: { goodsId, status: 'off' }
            })
            if (callRes.result.code === 0) {
              wx.showToast({ title: '已下架', icon: 'success' })
              this.loadMyGoods() // 刷新列表
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

  // 删除商品
  async deleteGoods(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？删除后不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callRes = await wx.cloud.callFunction({
              name: 'deleteGoods',
              data: { goodsId }
            })
            if (callRes.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadMyGoods()
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
  async markAsSold(e) {
    const goodsId = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定将该商品标记为已售吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callRes = await wx.cloud.callFunction({
              name: 'updateGoods',
              data: { goodsId, status: 'sold' }
            })
            if (callRes.result.code === 0) {
              wx.showToast({ title: '已标记', icon: 'success' })
              this.loadMyGoods() // 刷新列表
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
  }
})