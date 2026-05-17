const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const userRes = await db.collection('users').where({ openid: openid }).get()
    if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
      return { code: -1, message: '无权限' }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [usersRes, goodsRes, messagesRes, todayGoodsRes, todayMessagesRes] = await Promise.all([
      db.collection('users').count(),
      db.collection('goods').count(),
      db.collection('messages').count(),
      db.collection('goods').where({
        create_time: _.gte(todayStart).and(_.lte(todayEnd))
      }).count(),
      db.collection('messages').where({
        create_time: _.gte(todayStart).and(_.lte(todayEnd))
      }).count()
    ])

    return {
      code: 0,
      data: {
        totalUsers: usersRes.total,
        totalGoods: goodsRes.total,
        totalMessages: messagesRes.total,
        todayGoods: todayGoodsRes.total,
        todayMessages: todayMessagesRes.total
      }
    }
  } catch (err) {
    console.error('[adminGetStatistics] 错误:', err)
    return { code: -1, message: '操作失败' }
  }
}
