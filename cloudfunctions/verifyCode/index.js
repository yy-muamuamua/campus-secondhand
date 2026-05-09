const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')
const codes = db.collection('verification_codes')

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { email, code, studentId, type } = event // type: 'registration' 或 'student_verification'
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 1. 查询有效验证码
  const now = new Date()
  const codeRes = await codes.where({
    email,
    code,
    used: false,
    type: type || 'registration',
    expire_time: db.command.gt(now)
  }).get()

  if (codeRes.data.length === 0) {
    return { success: false, message: '验证码无效或已过期' }
  }

  // 2. 检查用户是否存在
  const userRes = await users.where({ openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在，请重新登录' }
  }
  const userId = userRes.data[0]._id

  if (type === 'student_verification') {
    // 学生认证：需要绑定学号
    // 检查学号是否已被绑定
    const existing = await users.where({ student_id: studentId }).get()
    if (existing.data.length > 0) {
      return { success: false, message: '该学号已被其他账号绑定' }
    }

    // 更新用户信息，绑定学号和邮箱
    await users.doc(userId).update({
      data: {
        student_id: studentId,
        email,
        email_verified: true,
        role: 'student' // 验证后的角色
      }
    })
  } else {
    // 注册验证：只验证邮箱
    await users.doc(userId).update({
      data: {
        email,
        email_verified: true
      }
    })
  }

  // 4. 标记验证码为已使用
  await codes.doc(codeRes.data[0]._id).update({
    data: { used: true }
  })

  return { success: true, message: type === 'student_verification' ? '学生认证成功' : '邮箱验证成功' }
}