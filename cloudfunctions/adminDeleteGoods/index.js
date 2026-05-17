const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { goodsId } = event

    const userRes = await db.collection('users').where({ openid: openid }).get()
    if (userRes.data.length === 0 || !userRes.data[0].isAdmin) {
      return { code: -1, message: '无权限' }
    }

    await db.collection('goods').doc(goodsId).remove()

    return { code: 0, message: '删除成功' }
  } catch (err) {
    console.error('[adminDeleteGoods] 错误:', err)
    return { code: -1, message: '操作失败' }
  }
}
