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
  const { contact_wechat, contact_phone } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userRes = await users.where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }
  const userId = userRes.data[0]._id

  const updateData = {}
  if (contact_wechat !== undefined) updateData.contact_wechat = contact_wechat
  if (contact_phone !== undefined) updateData.contact_phone = contact_phone

  try {
    await users.doc(userId).update({ data: updateData })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '更新失败' }
  }
}