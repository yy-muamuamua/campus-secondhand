// 获取订单详情云函数
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

    // 检查权限
    if (order.buyerOpenid !== openid && order.sellerOpenid !== openid) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    return {
      success: true,
      data: order
    }

  } catch (error) {
    console.error('[getOrderDetail] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}