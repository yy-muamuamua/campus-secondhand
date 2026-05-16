// 创建支付云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { orderId } = event

    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, code: 20001, message: '订单不存在' }
    }

    const order = orderRes.data

    // 检查权限（只有买家可以支付）
    if (order.buyerOpenid !== openid) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    // 检查订单状态（只有待付款状态可以支付）
    if (order.status !== 'pending_payment') {
      return { success: false, code: 20002, message: '订单状态错误' }
    }

    // 生成支付参数（模拟）
    const paymentData = {
      orderId,
      orderNo: order.orderNo,
      amount: order.totalAmount,
      description: `购买商品: ${order.goodsInfo.title}`,
      timeStamp: Date.now().toString(),
      nonceStr: generateNonceStr(),
      sign: 'simulated_sign'
    }

    // 更新订单状态为已付款
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'paid',
        paymentInfo: {
          method: 'wechat_pay',
          transactionId: 'simulated_tx_id_' + Date.now(),
          paidAt: db.serverDate()
        },
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      data: paymentData
    }

  } catch (error) {
    console.error('[createPayment] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}

// 生成随机字符串
function generateNonceStr() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}