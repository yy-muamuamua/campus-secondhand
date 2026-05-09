const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const favorites = db.collection('favorites')
const _ = db.command

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { goodsId } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!goodsId) {
    return { code: -1, message: '缺少商品ID' }
  }

  // 获取当前用户的 _id
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id
  
  // 检查用户权限：只有验证后的用户才能收藏
  if (!user.email_verified) {
    return { code: -1, message: '请先完成学生认证' }
  }

  // 检查商品是否存在
  const goodsRes = await db.collection('goods').doc(goodsId).get()
  if (!goodsRes.data) {
    return { code: -1, message: '商品不存在' }
  }

  try {
    // 添加收藏记录（使用 add 并捕获重复键错误）
    await favorites.add({
      data: {
        user_id: userId,
        goods_id: goodsId,
        create_time: db.serverDate()
      }
    })
    return { code: 0, message: '收藏成功' }
  } catch (err) {
    // 如果违反唯一索引（已收藏），返回友好提示
    if (err.code === 11000) { // 云开发重复键错误码
      return { code: -1, message: '您已经收藏过该商品' }
    }
    console.error(err)
    return { code: -1, message: '收藏失败' }
  }
}