const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const adminRes = await users.where({ openid }).get()
  if (adminRes.data.length === 0 || !adminRes.data[0].isAdmin) {
    return { code: -1, message: '无权访问' }
  }

  const { userId, disabled } = event
  if (!userId) return { code: -1, message: '缺少用户ID' }

  try {
    await users.doc(userId).update({
      data: { disabled: disabled === true }
    })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '操作失败' }
  }
}