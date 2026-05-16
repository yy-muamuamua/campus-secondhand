<template>
  <view class="container">
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.name }}
        <view v-if="tab.count > 0" class="badge">{{ tab.count > 99 ? '99+' : tab.count }}</view>
      </view>
    </view>

    <view class="order-list">
      <view v-if="orders.length === 0" class="empty-state">
        <view class="empty-icon">📦</view>
        <text class="empty-text">暂无订单</text>
      </view>

      <view v-for="order in orders" :key="order._id" class="order-item" @click="goToDetail(order._id)">
        <view class="order-header">
          <text class="order-no">订单号：{{ order.orderNo }}</text>
          <text :class="['order-status', order.status]">{{ getStatusText(order.status) }}</text>
        </view>

        <view class="order-content">
          <image class="goods-image" :src="order.goodsInfo.images[0]" mode="aspectFill" />
          <view class="goods-info">
            <text class="goods-title">{{ order.goodsInfo.title }}</text>
            <text class="goods-price">¥{{ (order.totalAmount / 100).toFixed(2) }}</text>
            <text class="goods-quantity">数量：{{ order.quantity }}</text>
          </view>
        </view>

        <view class="order-footer">
          <text class="order-time">{{ formatTime(order.createTime) }}</text>
          <view class="order-actions">
            <button v-if="order.status === 'pending_payment'" class="action-btn primary" @click.stop="payOrder(order)">立即付款</button>
            <button v-if="order.status === 'pending_payment'" class="action-btn" @click.stop="cancelOrder(order)">取消订单</button>
            <button v-if="order.status === 'paid'" class="action-btn" @click.stop="remindSeller(order)">提醒发货</button>
            <button v-if="order.status === 'shipped'" class="action-btn primary" @click.stop="confirmReceipt(order)">确认收货</button>
            <button v-if="order.status === 'received'" class="action-btn" @click.stop="goToReview(order)">去评价</button>
            <button v-if="order.status === 'completed'" class="action-btn" @click.stop="buyAgain(order)">再次购买</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'all',
      tabs: [
        { key: 'all', name: '全部', count: 0 },
        { key: 'buy', name: '我买到的', count: 0 },
        { key: 'sell', name: '我卖出的', count: 0 }
      ],
      orders: [],
      page: 0,
      size: 10
    }
  },
  onLoad() {
    this.loadOrders()
  },
  onShow() {
    this.loadOrders()
  },
  methods: {
    switchTab(key) {
      this.activeTab = key
      this.page = 0
      this.loadOrders()
    },
    async loadOrders() {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getOrderList',
          data: {
            type: this.activeTab,
            page: this.page,
            size: this.size
          }
        })
        
        if (result.result.success) {
          if (this.page === 0) {
            this.orders = result.result.data.orders
          } else {
            this.orders = [...this.orders, ...result.result.data.orders]
          }
        }
      } catch (error) {
        console.error('加载订单失败:', error)
      }
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
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    goToDetail(orderId) {
      wx.navigateTo({
        url: `/pages/orderDetail/index?id=${orderId}`
      })
    },
    async payOrder(order) {
      wx.showModal({
        title: '支付确认',
        content: `确认支付 ¥${(order.totalAmount / 100).toFixed(2)} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await wx.cloud.callFunction({
                name: 'createPayment',
                data: { orderId: order._id }
              })
              if (result.result.success) {
                wx.showToast({ title: '支付成功', icon: 'success' })
                this.loadOrders()
              }
            } catch (error) {
              wx.showToast({ title: '支付失败', icon: 'none' })
            }
          }
        }
      })
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
                this.loadOrders()
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
                this.loadOrders()
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
    }
  }
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.tabs {
  display: flex;
  background-color: #fff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  position: relative;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  transition: color 0.3s;

  &.active {
    color: #1989fa;
    font-weight: 500;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background-color: #1989fa;
      border-radius: 2rpx;
    }
  }

  .badge {
    position: absolute;
    top: 10rpx;
    right: 30rpx;
    min-width: 32rpx;
    height: 32rpx;
    background-color: #f56c6c;
    color: #fff;
    font-size: 20rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8rpx;
  }
}

.order-list {
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;

  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.order-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .order-no {
    font-size: 24rpx;
    color: #999;
  }

  .order-status {
    font-size: 26rpx;
    font-weight: 500;

    &.pending_payment { color: #f56c6c; }
    &.paid { color: #e6a23c; }
    &.shipped { color: #1989fa; }
    &.received { color: #67c23a; }
    &.completed { color: #999; }
    &.cancelled { color: #999; }
    &.refunding { color: #e6a23c; }
    &.refunded { color: #999; }
  }
}

.order-content {
  display: flex;
  padding: 24rpx;
  gap: 20rpx;

  .goods-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background-color: #f5f5f5;
  }

  .goods-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .goods-title {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .goods-price {
      font-size: 32rpx;
      color: #f56c6c;
      font-weight: 600;
    }

    .goods-quantity {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: #fafafa;

  .order-time {
    font-size: 22rpx;
    color: #999;
  }

  .order-actions {
    display: flex;
    gap: 16rpx;

    .action-btn {
      padding: 12rpx 32rpx;
      font-size: 24rpx;
      border-radius: 32rpx;
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