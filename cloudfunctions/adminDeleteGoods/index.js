const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const { goodsId } = event
  if (!goodsId) return { code: -1, message: '缺少商品ID' }

  try {
    await goods.doc(goodsId).remove()
    return { code: 0, message: '删除成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '删除失败' }
  }
}