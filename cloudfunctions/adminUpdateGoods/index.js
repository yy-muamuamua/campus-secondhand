const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 校验管理员
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const { goodsId, status } = event
  if (!goodsId) return { code: -1, message: '缺少商品ID' }

  try {
    await goods.doc(goodsId).update({
      data: { status, update_time: db.serverDate() }
    })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '操作失败' }
  }
}