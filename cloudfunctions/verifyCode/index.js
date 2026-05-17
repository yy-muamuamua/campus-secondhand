const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')
const codes = db.collection('verification_codes')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { email, code, type, studentId } = event

  try {
    const codeRes = await codes
      .where({
        email: email,
        type: type || 'registration',
        used: false
      })
      .orderBy('send_time', 'desc')
      .get()

    if (codeRes.data.length === 0) {
      return {
        success: false,
        message: '请先获取验证码'
      }
    }

    const validCode = codeRes.data[0]
    const expireTime = new Date(validCode.expire_time)
    const currentTime = new Date()

    if (currentTime > expireTime) {
      return {
        success: false,
        message: '验证码已过期，请重新获取'
      }
    }

    if (validCode.code !== code) {
      return {
        success: false,
        message: '验证码错误'
      }
    }

    await codes.doc(validCode._id).update({
      data: { used: true }
    })

    if (type === 'student_verification') {
      const userRes = await users.where({ openid: openid }).get()
      
      if (userRes.data.length > 0) {
        await users.doc(userRes.data[0]._id).update({
          data: {
            student_id: studentId,
            email_verified: true,
            email: email,
            role: 'student',
            update_time: db.serverDate()
          }
        })
      } else {
        await users.add({
          data: {
            openid: openid,
            student_id: studentId,
            email: email,
            email_verified: true,
            role: 'student',
            create_time: db.serverDate()
          }
        })
      }

      return {
        success: true,
        message: '学生认证成功'
      }
    }

    return {
      success: true,
      message: '验证成功'
    }
  } catch (err) {
    console.error('[verifyCode] 错误:', err)
    return {
      success: false,
      message: '操作失败，请稍后重试',
      error: err
    }
  }
}
