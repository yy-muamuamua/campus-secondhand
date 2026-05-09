const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')
const users = db.collection('users')

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { title, description, price, category, images } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!title || !description || price === undefined || !category) {
    return { success: false, message: '缺少必要参数' }
  }

  const userRes = await users.where({ openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在，请先登录' }
  }
  const user = userRes.data[0]
  if (user.role !== 'student') {
    return { success: false, message: '请先完成学号验证' }
  }

  const now = db.serverDate()
  const newGoods = {
    title,
    description,
    price: parseFloat(price),
    category,
    images: images || [],
    seller_id: user._id,
    status: 'on',
    create_time: now,
    update_time: now,
    views: 0
  }

  try {
    const res = await goods.add({ data: newGoods })
    return { success: true, message: '发布成功', data: { _id: res._id } }
  } catch (err) {
    console.error('[publishGoods] 错误:', err)
    return { success: false, message: '发布失败，请稍后重试' }
  }
}