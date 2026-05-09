Page({
  data: {
    // 表单字段初始值
    title: '',
    description: '',
    price: '',
    category: '书籍',           // 默认分类
    categoryIndex: 0,           // picker 默认选中索引
    categories: ['书籍', '电子产品', '生活用品', '其他'], // 分类选项
    images: [],                 // 本地图片临时路径（用于预览）
    imageFileIDs: [],           // 上传后的云 fileID
    isPublishing: false         // 发布按钮加载状态
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

  // 选择图片并上传到云存储
  async uploadImages() {
    const count = 9 - this.data.images.length // 最多9张
    if (count <= 0) {
      wx.showToast({ title: '最多选9张', icon: 'none' })
      return
    }

    const res = await wx.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    })

    const tempFilePaths = res.tempFilePaths
    // 先保存本地路径用于预览
    this.setData({ images: this.data.images.concat(tempFilePaths) })

    const uploadTasks = tempFilePaths.map((filePath, index) => {
      const cloudPath = `goods/${Date.now()}_${Math.random()}.jpg`
      return wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
    })

    try {
      const uploadRes = await Promise.all(uploadTasks)
      const fileIDs = uploadRes.map(item => item.fileID)
      // 保存 fileID 到 data
      this.setData({ imageFileIDs: this.data.imageFileIDs.concat(fileIDs) })
      return fileIDs
    } catch (err) {
      console.error('上传失败', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
      return []
    }
  },

  // 删除某张图片（可选）
  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    const fileIDs = this.data.imageFileIDs
    images.splice(index, 1)
    fileIDs.splice(index, 1)
    this.setData({ images, imageFileIDs: fileIDs })
  },

  // 发布按钮点击
  async onPublish() {
    // 简单校验
    if (!this.data.title) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!this.data.price || isNaN(this.data.price) || parseFloat(this.data.price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    // 防止重复点击
    if (this.data.isPublishing) {
      return
    }

    // 设置发布状态
    this.setData({ isPublishing: true })

    try {
      // 如果有图片但未上传（正常情况下应该已上传），这里可以再确保上传一次
      let fileIDs = this.data.imageFileIDs
      if (this.data.images.length > 0 && fileIDs.length === 0) {
        fileIDs = await this.uploadImages()
      }

      const res = await wx.cloud.callFunction({
        name: 'publishGoods',
        data: {
          title: this.data.title,
          description: this.data.description,
          price: parseFloat(this.data.price),
          category: this.data.category,
          images: fileIDs
        }
      })

      if (res.result.success) {
        wx.showToast({ title: '发布成功', icon: 'success' })
        // 返回上一页或跳转到商品详情
        wx.navigateBack()
      } else {
        wx.showToast({ title: res.result.message || '发布失败', icon: 'none' })
      }
    } catch (err) {
      console.error('发布失败', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      // 恢复按钮状态
      this.setData({ isPublishing: false })
    }
  }
})
