const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')
const _ = db.command

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { goodsId, title, description, price, category, images, status } = event
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
    return { code: -1, message: '无权限修改' }
  }

  // 构建更新数据（只更新传入的字段）
  const updateData = { update_time: db.serverDate() }
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (price !== undefined) updateData.price = parseFloat(price)
  if (category !== undefined) updateData.category = category
  if (images !== undefined) updateData.images = images
  if (status !== undefined) updateData.status = status

  try {
    await goods.doc(goodsId).update({ data: updateData })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '更新失败' }
  }
}