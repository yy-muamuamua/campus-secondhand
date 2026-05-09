const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const totalUsers = await db.collection('users').count()
  const totalGoods = await db.collection('goods').count()
  const totalMessages = await db.collection('messages').count()

  const todayGoods = await db.collection('goods').where({
    create_time: _.gte(todayStart)
  }).count()

  const todayMessages = await db.collection('messages').where({
    create_time: _.gte(todayStart)
  }).count()

  return {
    code: 0,
    data: {
      totalUsers: totalUsers.total,
      totalGoods: totalGoods.total,
      totalMessages: totalMessages.total,
      todayGoods: todayGoods.total,
      todayMessages: todayMessages.total
    }
  }
}