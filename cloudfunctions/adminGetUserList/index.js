const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userRes = await users.where({ openid }).get()
  if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const { page = 1, pageSize = 20 } = event
  const skip = (page - 1) * pageSize

  const countRes = await users.count()
  const listRes = await users.skip(skip).limit(pageSize).get()

  return {
    code: 0,
    data: {
      list: listRes.data,
      total: countRes.total,
      page,
      pageSize,
      hasMore: skip + listRes.data.length < countRes.total
    }
  }
}