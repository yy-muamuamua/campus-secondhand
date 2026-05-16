// 确认收货云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { orderId } = event

    const result = await db.collection('orders').doc(orderId).get()
    
    if (!result.data) {
      return { success: false, code: 20001, message: '订单不存在' }
    }

    const order = result.data

    // 检查权限（只有买家可以确认收货）
    if (order.buyerOpenid !== openid) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    // 检查订单状态（只有已发货状态可以确认收货）
    if (order.status !== 'shipped') {
      return { success: false, code: 20002, message: '订单状态错误' }
    }

    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'received',
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '收货成功'
    }

  } catch (error) {
    console.error('[confirmReceipt] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}