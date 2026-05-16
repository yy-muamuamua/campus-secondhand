// 更新物流信息云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { orderId, trackingNumber, deliveryCompany, status } = event

    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, code: 20001, message: '订单不存在' }
    }

    const order = orderRes.data

    // 检查权限（只有卖家可以更新物流）
    if (order.sellerOpenid !== openid) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    // 更新订单物流信息
    await db.collection('orders').doc(orderId).update({
      data: {
        logisticsInfo: {
          trackingNumber,
          deliveryCompany,
          status: status || 'in_transit'
        },
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '物流信息已更新'
    }

  } catch (error) {
    console.error('[updateLogistics] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}