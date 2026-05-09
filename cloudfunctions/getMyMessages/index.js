const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const messages = db.collection('messages')
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

  // 查询该用户的所有留言（按时间倒序）
  const msgRes = await messages.where({
    user_id: userId
  }).orderBy('create_time', 'desc').get()

  const list = msgRes.data

  // 获取关联的商品信息（标题、图片）
  const goodsIds = [...new Set(list.map(m => m.goods_id))]
  const goodsRes = await goods.where({
    _id: _.in(goodsIds)
  }).get()
  const goodsMap = {}
  goodsRes.data.forEach(g => {
    goodsMap[g._id] = {
      title: g.title,
      image: g.images && g.images[0] ? g.images[0] : '/images/default.png'
    }
  })

  // 组装数据
  const result = list.map(m => ({
    ...m,
    goodsInfo: goodsMap[m.goods_id] || { title: '商品已下架', image: '/images/default.png' }
  }))

  return { code: 0, data: result }
}