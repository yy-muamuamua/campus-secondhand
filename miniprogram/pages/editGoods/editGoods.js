Page({
  data: {
    goodsId: '',
    title: '',
    description: '',
    price: '',
    category: '书籍',
    categoryIndex: 0,
    categories: ['书籍', '电子产品', '生活用品', '其他'],
    images: [],          // 本地预览路径（新选图片）
    originalImages: [],  // 原商品图片 fileID（用于显示原有图片）
    imageFileIDs: [],    // 最终提交的 fileID 数组（原图 + 新图）
    loading: true,
    saving: false
  },

  onLoad(options) {
    if (options.goodsId) {
      this.setData({ goodsId: options.goodsId }, () => {
        this.loadGoodsDetail()
      })
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 加载商品详情
  async loadGoodsDetail() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getGoodsDetail',
        data: { goodsId: this.data.goodsId }
      })
      if (res.result.code === 0) {
        const goods = res.result.data
        // 找到分类索引
        const categoryIndex = this.data.categories.indexOf(goods.category) || 0
        this.setData({
          title: goods.title,
          description: goods.description,
          price: goods.price.toString(),
          category: goods.category,
          categoryIndex,
          originalImages: goods.images || [],
          imageFileIDs: goods.images || [], // 初始化提交数组为原图
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

  // 标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 描述输入
  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  // 价格输入
  onPriceInput(e) {
    this.setData({ price: e.detail.value })
  },

  // 分类选择
  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index]
    })
  },

  // 选择并上传新图片（复用发布页的上传逻辑）
  async uploadImages() {
    const count = 9 - this.data.images.length
    if (count <= 0) {
      wx.showToast({ title: '最多9张', icon: 'none' })
      return
    }

    const res = await wx.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    })

    const tempFilePaths = res.tempFilePaths
    this.setData({ images: this.data.images.concat(tempFilePaths) })

    const uploadTasks = tempFilePaths.map((filePath, index) => {
      const cloudPath = `goods/${Date.now()}_${Math.random()}.jpg`
      return wx.cloud.uploadFile({ cloudPath, filePath })
    })

    try {
      const uploadRes = await Promise.all(uploadTasks)
      const fileIDs = uploadRes.map(item => item.fileID)
      // 新图片 fileID 合并到提交数组中
      this.setData({ imageFileIDs: this.data.imageFileIDs.concat(fileIDs) })
    } catch (err) {
      console.error('上传失败', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  // 删除某张图片（区分原图和新图）
  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const type = e.currentTarget.dataset.type // 'original' 或 'new'
    if (type === 'original') {
      // 从原图数组中移除，同时从提交数组中移除对应的 fileID
      const original = this.data.originalImages
      const removed = original[index]
      original.splice(index, 1)
      const newFileIDs = this.data.imageFileIDs.filter(id => id !== removed)
      this.setData({
        originalImages: original,
        imageFileIDs: newFileIDs
      })
    } else {
      // 从新图预览中移除，同时从提交数组中移除对应的 fileID（注意新图fileID在对应位置）
      const images = this.data.images
      const fileIDs = this.data.imageFileIDs
      // 新图 fileID 存储在 imageFileIDs 的末尾部分，需要找到对应关系
      // 简化：新图按顺序对应，删除第 index 个新图，同时删除 imageFileIDs 中对应位置（在原图数量之后）
      const originalCount = this.data.originalImages.length
      images.splice(index, 1)
      fileIDs.splice(originalCount + index, 1)
      this.setData({
        images,
        imageFileIDs: fileIDs
      })
    }
  },

  // 保存修改
  async save() {
    if (!this.data.title) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!this.data.price || isNaN(this.data.price) || parseFloat(this.data.price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateGoods',
        data: {
          goodsId: this.data.goodsId,
          title: this.data.title,
          description: this.data.description,
          price: parseFloat(this.data.price),
          category: this.data.category,
          images: this.data.imageFileIDs // 提交最终图片数组
        }
      })
      if (res.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
        this.setData({ saving: false })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '保存失败', icon: 'none' })
      this.setData({ saving: false })
    }
  }
})