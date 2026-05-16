<template>
  <view class="container">
    <view v-if="order" class="review-form">
      <view class="section">
        <view class="section-title">商品评价</view>
        <view class="goods-card" @click="goToGoods(order.goodsId)">
          <image class="goods-image" :src="order.goodsInfo.images[0]" mode="aspectFill" />
          <view class="goods-info">
            <text class="goods-title">{{ order.goodsInfo.title }}</text>
            <text class="goods-price">¥{{ (order.totalAmount / 100).toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">商品评分</view>
        <view class="rating-section">
          <view class="star-group">
            <view 
              v-for="i in 5" 
              :key="'product-' + i" 
              :class="['star', { active: productRating >= i }]"
              @click="setProductRating(i)"
            >★</view>
          </view>
          <text class="rating-text">{{ getRatingText(productRating) }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">卖家评分</view>
        <view class="rating-section">
          <view class="star-group">
            <view 
              v-for="i in 5" 
              :key="'seller-' + i" 
              :class="['star', { active: sellerRating >= i }]"
              @click="setSellerRating(i)"
            >★</view>
          </view>
          <text class="rating-text">{{ getRatingText(sellerRating) }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">评价内容</view>
        <textarea 
          v-model="content" 
          class="review-textarea" 
          placeholder="请输入您的评价内容（选填）"
          maxlength="500"
        />
        <text class="word-count">{{ content.length }}/500</text>
      </view>

      <view class="section">
        <view class="section-title">上传图片（选填）</view>
        <view class="upload-section">
          <view 
            v-for="(image, index) in images" 
            :key="index" 
            class="upload-item"
          >
            <image :src="image" mode="aspectFill" />
            <view class="remove-btn" @click="removeImage(index)">×</view>
          </view>
          <view 
            v-if="images.length < 9" 
            class="upload-item add-btn"
            @click="chooseImage"
          >
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="submit-btn" :class="{ disabled: !canSubmit }" @click="submitReview">提交评价</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderId: '',
      order: null,
      productRating: 0,
      sellerRating: 0,
      content: '',
      images: []
    }
  },
  onLoad(options) {
    if (options.orderId) {
      this.orderId = options.orderId
      this.loadOrder()
    }
  },
  computed: {
    canSubmit() {
      return this.productRating > 0 && this.sellerRating > 0
    }
  },
  methods: {
    async loadOrder() {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getOrderDetail',
          data: { orderId: this.orderId }
        })
        
        if (result.result.success) {
          this.order = result.result.data
        }
      } catch (error) {
        console.error('加载订单失败:', error)
      }
    },
    setProductRating(rating) {
      this.productRating = rating
    },
    setSellerRating(rating) {
      this.sellerRating = rating
    },
    getRatingText(rating) {
      if (rating === 0) return '请评分'
      if (rating <= 2) return '差'
      if (rating === 3) return '一般'
      if (rating === 4) return '好'
      return '非常好'
    },
    goToGoods(goodsId) {
      wx.navigateTo({
        url: `/pages/detail/index?id=${goodsId}`
      })
    },
    chooseImage() {
      wx.chooseImage({
        count: 9 - this.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.images = [...this.images, ...res.tempFilePaths]
        }
      })
    },
    removeImage(index) {
      this.images.splice(index, 1)
    },
    async submitReview() {
      if (!this.canSubmit) {
        wx.showToast({ title: '请完成评分', icon: 'none' })
        return
      }

      wx.showLoading({ title: '提交中...' })

      try {
        const result = await wx.cloud.callFunction({
          name: 'addReview',
          data: {
            orderId: this.orderId,
            productRating: this.productRating,
            sellerRating: this.sellerRating,
            content: this.content,
            images: this.images
          }
        })

        wx.hideLoading()

        if (result.result.success) {
          wx.showToast({ title: '评价成功', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({ title: result.result.message || '评价失败', icon: 'none' })
        }
      } catch (error) {
        wx.hideLoading()
        console.error('提交评价失败:', error)
        wx.showToast({ title: '评价失败', icon: 'none' })
      }
    }
  }
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 160rpx;
}

.section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 24rpx;

  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
  }
}

.goods-card {
  display: flex;
  gap: 20rpx;
  padding: 16rpx;
  background-color: #fafafa;
  border-radius: 12rpx;

  .goods-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background-color: #fff;
  }

  .goods-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .goods-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .goods-price {
      font-size: 30rpx;
      font-weight: 600;
      color: #f56c6c;
    }
  }
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .star-group {
    display: flex;
    gap: 8rpx;

    .star {
      font-size: 48rpx;
      color: #ddd;
      transition: color 0.2s;

      &.active {
        color: #ffb800;
      }
    }
  }

  .rating-text {
    font-size: 26rpx;
    color: #999;
  }
}

.review-textarea {
  width: 100%;
  height: 200rpx;
  padding: 20rpx;
  background-color: #fafafa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.word-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
}

.upload-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;

  .upload-item {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    overflow: hidden;
    position: relative;
    background-color: #fafafa;

    image {
      width: 100%;
      height: 100%;
    }

    .remove-btn {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      width: 40rpx;
      height: 40rpx;
      background-color: rgba(0, 0, 0, 0.5);
      color: #fff;
      font-size: 32rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &.add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx dashed #ddd;

      .add-icon {
        font-size: 48rpx;
        color: #999;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .submit-btn {
    width: 100%;
    height: 88rpx;
    font-size: 32rpx;
    background-color: #1989fa;
    color: #fff;
    border-radius: 44rpx;

    &.disabled {
      background-color: #ccc;
    }
  }
}
</style>