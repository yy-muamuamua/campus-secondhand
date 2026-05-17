const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { page = 1, pageSize = 10 } = event

    const userRes = await db.collection('users').where({ openid: openid }).get()
    if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
      return { code: -1, message: '无权限' }
    }

    const countRes = await db.collection('messages').count()
    const total = countRes.total

    const res = await db.collection('messages')
      .orderBy('create_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: res.data,
        total: total,
        hasMore: page * pageSize < total
      }
    }
  } catch (err) {
    console.error('[adminGetMessageList] 错误:', err)
    return { code: -1, message: '操作失败' }
  }
}
