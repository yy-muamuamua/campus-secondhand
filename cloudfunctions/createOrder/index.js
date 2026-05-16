// 订单创建云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { goodsId, deliveryMethod, pickupLocation, deliveryAddress } = event

    // 获取商品信息
    const goodsRes = await db.collection('goods').doc(goodsId).get()
    if (goodsRes.data.length === 0) {
      return { success: false, code: 20001, message: '商品不存在' }
    }
    const goods = goodsRes.data[0]

    // 检查商品状态
    if (goods.status !== 'on') {
      return { success: false, code: 20002, message: '商品已下架' }
    }

    // 检查卖家不能购买自己的商品
    if (goods.sellerId === openid) {
      return { success: false, code: 20003, message: '不能购买自己发布的商品' }
    }

    // 获取卖家信息
    const sellerRes = await db.collection('users').where({ openid: goods.sellerId }).get()
    if (sellerRes.data.length === 0) {
      return { success: false, code: 20004, message: '卖家不存在' }
    }
    const seller = sellerRes.data[0]

    // 生成订单号
    const orderNo = generateOrderNo()

    // 创建订单记录
    const orderData = {
      orderNo,
      buyerOpenid: openid,
      sellerOpenid: goods.sellerId,
      goodsId,
      goodsInfo: {
        title: goods.title,
        price: goods.price,
        images: goods.images,
        description: goods.description
      },
      quantity: 1,
      totalAmount: goods.price,
      status: 'pending_payment',
      deliveryMethod,
      pickupLocation: deliveryMethod === 'campus_pickup' ? pickupLocation : null,
      deliveryAddress: deliveryMethod === 'campus_delivery' ? deliveryAddress : null,
      logisticsInfo: {},
      paymentInfo: {},
      refundInfo: {},
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const result = await db.collection('orders').add({ data: orderData })

    // 更新商品浏览量
    await db.collection('goods').doc(goodsId).update({
      data: { views: db.command.inc(1) }
    })

    return {
      success: true,
      data: {
        orderId: result._id,
        orderNo,
        totalAmount: goods.price
      }
    }

  } catch (error) {
    console.error('[createOrder] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}

// 生成订单号
function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `ORD${year}${month}${day}${hours}${minutes}${seconds}${random}`
}