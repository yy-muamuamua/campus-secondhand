// 添加评价云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { orderId, productRating, sellerRating, content, images } = event

    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, code: 20001, message: '订单不存在' }
    }

    const order = orderRes.data

    // 检查权限（只有买家可以评价）
    if (order.buyerOpenid !== openid) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    // 检查订单状态（只有已收货状态可以评价）
    if (order.status !== 'received') {
      return { success: false, code: 30002, message: '订单未完成，无法评价' }
    }

    // 检查是否已评价
    const reviewRes = await db.collection('reviews').where({ orderId }).get()
    if (reviewRes.data.length > 0) {
      return { success: false, code: 30001, message: '已存在评价' }
    }

    // 创建评价记录
    const reviewData = {
      orderId,
      goodsId: order.goodsId,
      reviewerOpenid: openid,
      revieweeOpenid: order.sellerOpenid,
      productRating,
      sellerRating,
      content: content || '',
      images: images || [],
      createTime: db.serverDate()
    }

    await db.collection('reviews').add({ data: reviewData })

    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'completed',
        updateTime: db.serverDate()
      }
    })

    // 更新商品评分
    await updateProductRating(order.goodsId)

    // 更新卖家评分
    await updateSellerRating(order.sellerOpenid)

    return {
      success: true,
      message: '评价成功'
    }

  } catch (error) {
    console.error('[addReview] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}

// 更新商品评分
async function updateProductRating(goodsId) {
  const result = await db.collection('reviews')
    .where({ goodsId })
    .field({ productRating: true })
    .get()

  if (result.data.length > 0) {
    const ratings = result.data.map(r => r.productRating)
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

    await db.collection('goods').doc(goodsId).update({
      data: {
        rating: avgRating,
        reviewCount: result.data.length
      }
    })
  }
}

// 更新卖家评分
async function updateSellerRating(sellerOpenid) {
  const result = await db.collection('reviews')
    .where({ revieweeOpenid: sellerOpenid })
    .field({ sellerRating: true })
    .get()

  if (result.data.length > 0) {
    const ratings = result.data.map(r => r.sellerRating)
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

    // 先查询用户文档ID，再用doc(id).update()更新
    const userRes = await db.collection('users').where({ openid: sellerOpenid }).get()
    if (userRes.data.length === 1) {
      const userId = userRes.data[0]._id
      await db.collection('users').doc(userId).update({
        data: {
          sellerRating: avgRating,
          reviewCount: result.data.length
        }
      })
    }
  }
}