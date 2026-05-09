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

  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  const userId = userRes.data[0]._id

  const countRes = await favorites.where({
    user_id: userId,
    goods_id: goodsId
  }).count()

  return { code: 0, data: countRes.total > 0 }
}