// 获取商品评价列表云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { goodsId, page = 0, size = 10 } = event

    const result = await db.collection('reviews')
      .where({ goodsId })
      .orderBy('createTime', 'desc')
      .skip(page * size)
      .limit(size)
      .get()

    // 查询总评价数
    const countResult = await db.collection('reviews')
      .where({ goodsId })
      .count()

    // 获取评价者信息
    const reviewsWithUser = await Promise.all(
      result.data.map(async review => {
        const userRes = await db.collection('users')
          .where({ openid: review.reviewerOpenid })
          .field({ nickname: true, avatar: true })
          .get()
        
        return {
          ...review,
          reviewer: userRes.data[0] || {}
        }
      })
    )

    return {
      success: true,
      data: {
        reviews: reviewsWithUser,
        total: countResult.total
      }
    }

  } catch (error) {
    console.error('[getProductReviews] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}