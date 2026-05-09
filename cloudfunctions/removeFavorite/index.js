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
  const { messageId, reply } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!messageId || !reply) {
    return { code: -1, message: '参数不全' }
  }

  // 获取留言信息
  const msgRes = await messages.doc(messageId).get()
  if (!msgRes.data) {
    return { code: -1, message: '留言不存在' }
  }
  const msg = msgRes.data

  // 获取当前用户信息
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  const userId = userRes.data[0]._id

  // 检查当前用户是否为该商品的卖家
  const goodsRes = await goods.doc(msg.goods_id).get()
  if (!goodsRes.data || goodsRes.data.seller_id !== userId) {
    return { code: -1, message: '无权回复' }
  }

  try {
    await messages.doc(messageId).update({
      data: {
        reply,
        reply_time: db.serverDate()
      }
    })
    return { code: 0, message: '回复成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '回复失败' }
  }
}