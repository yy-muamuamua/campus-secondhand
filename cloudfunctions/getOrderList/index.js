// 获取订单列表云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { type = 'all', page = 0, size = 10 } = event

    let query = db.collection('orders')
    
    if (type === 'buy') {
      query = query.where({ buyerOpenid: openid })
    } else if (type === 'sell') {
      query = query.where({ sellerOpenid: openid })
    }

    const result = await query
      .orderBy('createTime', 'desc')
      .skip(page * size)
      .limit(size)
      .get()

    return {
      success: true,
      data: {
        orders: result.data,
        total: result.data.length
      }
    }

  } catch (error) {
    console.error('[getOrderList] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}