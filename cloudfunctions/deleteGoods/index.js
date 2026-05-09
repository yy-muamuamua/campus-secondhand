const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')

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

  // 检查商品是否存在且属于当前用户
  const goodsRes = await goods.doc(goodsId).get()
  if (!goodsRes.data) {
    return { code: -1, message: '商品不存在' }
  }
  const sellerId = goodsRes.data.seller_id
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || userRes.data[0]._id !== sellerId) {
    return { code: -1, message: '无权限删除' }
  }

  try {
    await goods.doc(goodsId).remove()
    // 可选：删除云存储中的图片（这里暂不处理，因为可能多个商品共用图片）
    return { code: 0, message: '删除成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '删除失败' }
  }
}