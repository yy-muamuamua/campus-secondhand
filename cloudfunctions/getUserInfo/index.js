const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userRes = await users.where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  const user = userRes.data[0]

  // 返回需要的信息（隐藏敏感字段如 openid）
  return {
    code: 0,
    data: {
      nickname: user.nickname || '',
      avatar: user.avatar || '',
      student_id: user.student_id || '',
      email_verified: user.email_verified || false,
      contact_wechat: user.contact_wechat || '',
      contact_phone: user.contact_phone || ''
    }
  }
}