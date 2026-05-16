<template>
  <view class="container">
    <view v-if="order" class="order-detail">
      <view class="status-bar" :class="order.status">
        <text class="status-icon">{{ getStatusIcon(order.status) }}</text>
        <view class="status-info">
          <text class="status-text">{{ getStatusText(order.status) }}</text>
          <text class="status-desc">{{ getStatusDesc(order.status) }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">订单信息</view>
        <view class="info-item">
          <text class="label">订单编号</text>
          <text class="value">{{ order.orderNo }}</text>
        </view>
        <view class="info-item">
          <text class="label">下单时间</text>
          <text class="value">{{ formatTime(order.createTime) }}</text>
        </view>
        <view class="info-item">
          <text class="label">交易方式</text>
          <text class="value">{{ order.deliveryMethod === 'campus_pickup' ? '校园自提' : '校内配送' }}</text>
        </view>
        <view v-if="order.deliveryMethod === 'campus_pickup'" class="info-item">
          <text class="label">自提地点</text>
          <text class="value">{{ order.pickupLocation }}</text>
        </view>
        <view v-if="order.deliveryMethod === 'campus_delivery'" class="info-item">
          <text class="label">配送地址</text>
          <text class="value">{{ order.deliveryAddress }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">商品信息</view>
        <view class="goods-card" @click="goToGoods(order.goodsId)">
          <image class="goods-image" :src="order.goodsInfo.images[0]" mode="aspectFill" />
          <view class="goods-detail">
            <text class="goods-title">{{ order.goodsInfo.title }}</text>
            <text class="goods-desc">{{ order.goodsInfo.description }}</text>
            <view class="goods-bottom">
              <text class="goods-price">¥{{ (order.totalAmount / 100).toFixed(2) }}</text>
              <text class="goods-quantity">x{{ order.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">交易金额</view>
        <view class="info-item">
          <text class="label">商品金额</text>
          <text class="value">¥{{ (order.totalAmount / 100).toFixed(2) }}</text>
        </view>
        <view class="info-item total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ (order.totalAmount / 100).toFixed(2) }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">卖家信息</view>
        <view v-if="seller" class="user-card">
          <view class="avatar-wrap">
            <image class="avatar" :src="seller.avatar || '/images/default-avatar.png'" mode="aspectFill" />
            <view class="verified" v-if="seller.studentVerified">✓</view>
          </view>
          <view class="user-info">
            <text class="user-name">{{ seller.nickname || '匿名用户' }}</text>
            <text class="user-id">{{ seller.studentId ? `学号：${seller.studentId}` : '' }}</text>
          </view>
          <button class="contact-btn" @click="goToChat(order.sellerOpenid)">联系卖家</button>
        </view>
      </view>

      <view v-if="order.logisticsInfo.trackingNumber" class="section">
        <view class="section-title">物流信息</view>
        <view class="logistics-item">
          <text class="logistics-label">快递公司</text>
          <text class="logistics-value">{{ order.logisticsInfo.deliveryCompany }}</text>
        </view>
        <view class="logistics-item">
          <text class="logistics-label">运单号</text>
          <text class="logistics-value">{{ order.logisticsInfo.trackingNumber }}</text>
        </view>
        <view class="logistics-item">
          <text class="logistics-label">物流状态</text>
          <text class="logistics-value">{{ getLogisticsStatus(order.logisticsInfo.status) }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="total-wrap">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{ order ? (order.totalAmount / 100).toFixed(2) : '0.00' }}</text>
      </view>
      <view class="actions">
        <button v-if="order?.status === 'pending_payment'" class="btn" @click="cancelOrder(order)">取消订单</button>
        <button v-if="order?.status === 'pending_payment'" class="btn primary" @click="payOrder(order)">立即付款</button>
        <button v-if="order?.status === 'paid'" class="btn primary" @click="remindSeller(order)">提醒发货</button>
        <button v-if="order?.status === 'shipped'" class="btn primary" @click="confirmReceipt(order)">确认收货</button>
        <button v-if="order?.status === 'received'" class="btn primary" @click="goToReview(order)">去评价</button>
        <button v-if="order?.status === 'completed'" class="btn" @click="buyAgain(order)">再次购买</button>
        <button v-if="order?.status === 'paid' || order?.status === 'shipped'" class="btn" @click="applyRefund(order)">申请退款</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      order: null,
      seller: null
    }
  },
  onLoad(options) {
    if (options.id) {
      this.loadOrder(options.id)
    }
  },
  methods: {
    async loadOrder(orderId) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getOrderDetail',
          data: { orderId }
        })
        
        if (result.result.success) {
          this.order = result.result.data
          this.loadSeller(this.order.sellerOpenid)
        }
      } catch (error) {
        console.error('加载订单失败:', error)
      }
    },
    async loadSeller(openid) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getUserInfo',
          data: { openid }
        })
        
        if (result.result.success) {
          this.seller = result.result.data
        }
      } catch (error) {
        console.error('加载卖家信息失败:', error)
      }
    },
    getStatusIcon(status) {
      const icons = {
        pending_payment: '⏳',
        paid: '💳',
        shipped: '📦',
        received: '✅',
        completed: '🎉',
        cancelled: '❌',
        refunding: '🔄',
        refunded: '💰'
      }
      return icons[status] || '📄'
    },
    getStatusText(status) {
      const statusMap = {
        pending_payment: '待付款',
        paid: '待发货',
        shipped: '待收货',
        received: '待评价',
        completed: '已完成',
        cancelled: '已取消',
        refunding: '退款中',
        refunded: '已退款'
      }
      return statusMap[status] || status
    },
    getStatusDesc(status) {
      const descMap = {
        pending_payment: '请在24小时内完成付款',
        paid: '等待卖家发货',
        shipped: '商品已发出，请留意物流信息',
        received: '请及时评价商品',
        completed: '感谢您的使用',
        cancelled: '订单已取消',
        refunding: '正在处理退款',
        refunded: '退款已完成'
      }
      return descMap[status] || ''
    },
    getLogisticsStatus(status) {
      const statusMap = {
        pending: '待发货',
        in_transit: '运输中',
        delivered: '已送达'
      }
      return statusMap[status] || status
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    goToGoods(goodsId) {
      wx.navigateTo({
        url: `/pages/detail/index?id=${goodsId}`
      })
    },
    goToChat(openid) {
      wx.navigateTo({
        url: `/pages/chat/index?openid=${openid}`
      })
    },
    async payOrder(order) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'createPayment',
          data: { orderId: order._id }
        })
        if (result.result.success) {
          wx.showToast({ title: '支付成功', icon: 'success' })
          this.loadOrder(order._id)
        }
      } catch (error) {
        wx.showToast({ title: '支付失败', icon: 'none' })
      }
    },
    async cancelOrder(order) {
      wx.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await wx.cloud.callFunction({
                name: 'cancelOrder',
                data: { orderId: order._id, reason: '买家主动取消' }
              })
              if (result.result.success) {
                wx.showToast({ title: '取消成功', icon: 'success' })
                this.loadOrder(order._id)
              }
            } catch (error) {
              wx.showToast({ title: '取消失败', icon: 'none' })
            }
          }
        }
      })
    },
    remindSeller(order) {
      wx.showToast({ title: '已提醒卖家发货', icon: 'success' })
    },
    async confirmReceipt(order) {
      wx.showModal({
        title: '确认收货',
        content: '请确认您已经收到商品',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await wx.cloud.callFunction({
                name: 'confirmReceipt',
                data: { orderId: order._id }
              })
              if (result.result.success) {
                wx.showToast({ title: '收货成功', icon: 'success' })
                this.loadOrder(order._id)
              }
            } catch (error) {
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    goToReview(order) {
      wx.navigateTo({
        url: `/pages/review/index?orderId=${order._id}`
      })
    },
    buyAgain(order) {
      wx.navigateTo({
        url: `/pages/detail/index?id=${order.goodsId}`
      })
    },
    applyRefund(order) {
      wx.showModal({
        title: '申请退款',
        content: '确定要申请退款吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await wx.cloud.callFunction({
                name: 'applyRefund',
                data: { orderId: order._id, reason: '买家申请退款' }
              })
              if (result.result.success) {
                wx.showToast({ title: '退款申请已提交', icon: 'success' })
                this.loadOrder(order._id)
              }
            } catch (error) {
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        }
      })
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

.status-bar {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;

  &.pending_payment { background: linear-gradient(135deg, #f56c6c, #f89898); }
  &.paid { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
  &.shipped { background: linear-gradient(135deg, #1989fa, #6ab7ff); }
  &.received { background: linear-gradient(135deg, #67c23a, #a8e063); }
  &.completed { background: linear-gradient(135deg, #909399, #b4b8bf); }
  &.cancelled { background: linear-gradient(135deg, #909399, #b4b8bf); }
  &.refunding { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
  &.refunded { background: linear-gradient(135deg, #67c23a, #a8e063); }

  .status-icon {
    font-size: 56rpx;
    margin-right: 20rpx;
  }

  .status-info {
    display: flex;
    flex-direction: column;

    .status-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .status-desc {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
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

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &.total {
    .label {
      font-size: 28rpx;
      font-weight: 500;
    }
    .value {
      font-size: 32rpx;
      font-weight: 600;
      color: #f56c6c;
    }
  }

  .label {
    font-size: 26rpx;
    color: #999;
  }

  .value {
    font-size: 26rpx;
    color: #333;
  }
}

.goods-card {
  display: flex;
  gap: 20rpx;
  padding: 16rpx;
  background-color: #fafafa;
  border-radius: 12rpx;

  .goods-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background-color: #fff;
  }

  .goods-detail {
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

    .goods-desc {
      font-size: 24rpx;
      color: #999;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .goods-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .goods-price {
        font-size: 30rpx;
        font-weight: 600;
        color: #f56c6c;
      }

      .goods-quantity {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: #fafafa;
  border-radius: 12rpx;

  .avatar-wrap {
    position: relative;

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background-color: #fff;
    }

    .verified {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 24rpx;
      height: 24rpx;
      background-color: #67c23a;
      border-radius: 50%;
      color: #fff;
      font-size: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .user-name {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
    }

    .user-id {
      font-size: 24rpx;
      color: #999;
    }
  }

  .contact-btn {
    padding: 16rpx 32rpx;
    font-size: 26rpx;
    background-color: #1989fa;
    color: #fff;
    border-radius: 32rpx;
  }
}

.logistics-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .logistics-label {
    font-size: 26rpx;
    color: #999;
  }

  .logistics-value {
    font-size: 26rpx;
    color: #333;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .total-wrap {
    display: flex;
    align-items: baseline;

    .total-label {
      font-size: 26rpx;
      color: #666;
    }

    .total-price {
      font-size: 36rpx;
      font-weight: 600;
      color: #f56c6c;
    }
  }

  .actions {
    display: flex;
    gap: 20rpx;

    .btn {
      padding: 20rpx 40rpx;
      font-size: 28rpx;
      border-radius: 40rpx;
      border: 1rpx solid #ddd;
      background-color: #fff;
      color: #666;

      &.primary {
        background-color: #1989fa;
        border-color: #1989fa;
        color: #fff;
      }
    }
  }
}
</style>