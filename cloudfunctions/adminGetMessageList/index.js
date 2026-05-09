const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const messages = db.collection('messages')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const { page = 1, pageSize = 20 } = event
  const skip = (page - 1) * pageSize

  const countRes = await messages.count()
  const listRes = await messages
    .orderBy('create_time', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  // 关联商品标题和用户昵称（可选）
  const goodsIds = [...new Set(listRes.data.map(m => m.goods_id))]
  const goodsRes = await db.collection('goods').where({ _id: _.in(goodsIds) }).get()
  const goodsMap = {}
  goodsRes.data.forEach(g => { goodsMap[g._id] = g.title })

  const userIds = [...new Set(listRes.data.map(m => m.user_id))]
  const userRes2 = await db.collection('users').where({ _id: _.in(userIds) }).get()
  const userMap = {}
  userRes2.data.forEach(u => { userMap[u._id] = u.nickname || u.openid })

  const list = listRes.data.map(m => ({
    ...m,
    goodsTitle: goodsMap[m.goods_id] || '已删除',
    userNickname: userMap[m.user_id] || '未知用户'
  }))

  return {
    code: 0,
    data: {
      list,
      total: countRes.total,
      page,
      pageSize,
      hasMore: skip + listRes.data.length < countRes.total
    }
  }
}