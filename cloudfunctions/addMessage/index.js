const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const messages = db.collection('messages')
const _ = db.command

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { goodsId, content } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!goodsId || !content) {
    return { success: false, message: '参数不全' }
  }

  // 获取当前用户 _id
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }
  const user = userRes.data[0]
  const userId = user._id
  
  // 检查用户权限：只有验证后的用户才能留言
  if (user.role !== 'student') {
    return { success: false, message: '请先完成学生认证' }
  }

  // 检查商品是否存在
  const goodsRes = await db.collection('goods').doc(goodsId).get()
  if (!goodsRes.data) {
    return { success: false, message: '商品不存在' }
  }

  try {
    await messages.add({
      data: {
        goods_id: goodsId,
        user_id: userId,
        content,
        create_time: db.serverDate()
      }
    })
    return { success: true, message: '留言成功' }
  } catch (err) {
    console.error(err)
    return { success: false, message: '留言失败' }
  }
}