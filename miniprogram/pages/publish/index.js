Page({
  data: {
    title: '',
    description: '',
    price: '',
    category: '书籍',
    categoryIndex: 0,
    categories: ['书籍', '电子产品', '生活用品', '其他'],
    images: [],
    imageFileIDs: [],
    isPublishing: false,
    showDialog: false,
    dialogTitle: '',
    dialogContent: '',
    dialogButtons: [{ text: '确定' }]
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value })
  },

  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index]
    })
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

  async uploadImages() {
    const count = 9 - this.data.images.length
    if (count <= 0) {
      this.showToast('最多选9张', 'warn')
      return
    }

    const res = await wx.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    })

    const tempFilePaths = res.tempFilePaths
    this.setData({ images: this.data.images.concat(tempFilePaths) })

    const uploadTasks = tempFilePaths.map((filePath) => {
      const cloudPath = `goods/${Date.now()}_${Math.random()}.jpg`
      return wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
    })

    try {
      const uploadRes = await Promise.all(uploadTasks)
      const fileIDs = uploadRes.map(item => item.fileID)
      this.setData({ imageFileIDs: this.data.imageFileIDs.concat(fileIDs) })
      return fileIDs
    } catch (err) {
      console.error('上传失败', err)
      this.showToast('上传失败', 'warn')
      return []
    }
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    const fileIDs = this.data.imageFileIDs
    images.splice(index, 1)
    fileIDs.splice(index, 1)
    this.setData({ images, imageFileIDs: fileIDs })
  },

  async onPublish() {
    if (!this.data.title) {
      this.showErrorDialog('提示', '请输入标题')
      return
    }
    if (!this.data.price || isNaN(this.data.price) || parseFloat(this.data.price) <= 0) {
      this.showErrorDialog('提示', '请输入有效价格')
      return
    }

    if (this.data.isPublishing) {
      return
    }

    this.setData({ isPublishing: true })

    try {
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
        this.showToast('发布成功', 'success')
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        this.showErrorDialog('发布失败', res.result.message || '请重试')
      }
    } catch (err) {
      console.error('发布失败', err)
      this.showErrorDialog('错误', '网络错误，请检查网络后重试')
    } finally {
      this.setData({ isPublishing: false })
    }
  }
})
