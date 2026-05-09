// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 校验管理员
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const { page = 1, pageSize = 20, status } = event
  const skip = (page - 1) * pageSize

  let where = {}
  if (status) where.status = status

  const countRes = await goods.where(where).count()
  const goodsRes = await goods.where(where)
    .orderBy('create_time', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return {
    code: 0,
    data: {
      list: goodsRes.data,
      total: countRes.total,
      page,
      pageSize,
      hasMore: skip + goodsRes.data.length < countRes.total
    }
  }
}