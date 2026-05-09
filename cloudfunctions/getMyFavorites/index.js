const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const favorites = db.collection('favorites')
const goods = db.collection('goods')
const _ = db.command

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 获取当前用户的 _id
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  const userId = userRes.data[0]._id

  // 查询该用户的收藏记录（按收藏时间倒序）
  const favRes = await favorites.where({
    user_id: userId
  }).orderBy('create_time', 'desc').get()

  // 如果没有收藏，直接返回空数组
  if (favRes.data.length === 0) {
    return { code: 0, data: [] }
  }

  // 获取所有被收藏的商品 ID
  const goodsIds = favRes.data.map(item => item.goods_id)

  // 批量查询商品详情（注意：商品可能已被下架或删除，需要过滤）
  const goodsRes = await goods.where({
    _id: _.in(goodsIds)
  }).get()

  // 将商品信息按收藏顺序组装
  const goodsMap = {}
  goodsRes.data.forEach(g => { goodsMap[g._id] = g })

  const list = favRes.data.map(fav => goodsMap[fav.goods_id]).filter(Boolean) // 过滤掉已不存在的商品

  return { code: 0, data: list }
}