// 取消订单云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { orderId, reason } = event

    const result = await db.collection('orders').doc(orderId).get()
    
    if (!result.data) {
      return { success: false, code: 20001, message: '订单不存在' }
    }

    const order = result.data

    // 检查权限（只有买家可以取消订单）
    if (order.buyerOpenid !== openid) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    // 检查订单状态（只有待付款状态可以取消）
    if (order.status !== 'pending_payment') {
      return { success: false, code: 20003, message: '无法取消订单' }
    }

    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'cancelled',
        refundInfo: {
          reason,
          status: 'completed'
        },
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '订单已取消'
    }

  } catch (error) {
    console.error('[cancelOrder] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}