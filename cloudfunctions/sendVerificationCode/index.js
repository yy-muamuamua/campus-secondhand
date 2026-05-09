const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const codes = db.collection('verification_codes')
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.qq.com',
  port: parseInt(process.env.MAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { email, type } = event // type: 'registration' 或 'student_verification'
  
  // 如果是学生认证，需要验证学校邮箱
  if (type === 'student_verification') {
    const emailSuffix = process.env.SCHOOL_EMAIL_SUFFIX || '@stu.university.edu.cn'
    if (!email.endsWith(emailSuffix)) {
      return { success: false, message: '请使用学校邮箱进行学生认证' }
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const now = new Date()
  const expireTime = new Date(now.getTime() + 5 * 60 * 1000)

  try {
    await codes.add({
      data: {
        email,
        code,
        expire_time: expireTime,
        used: false,
        type: type || 'registration',
        send_time: db.serverDate()
      }
    })

    const subject = type === 'student_verification' ? '学号验证码' : '注册验证码'
    const text = `您的验证码是：${code}，请在5分钟内完成${type === 'student_verification' ? '学生认证' : '注册'}。`

    await transporter.sendMail({
      from: `"校园二手" <${process.env.MAIL_USER}>`,
      to: email,
      subject: subject,
      text: text
    })

    return { success: true, message: '验证码已发送' }
  } catch (err) {
    console.error('[sendVerificationCode] 错误:', err)
    return { success: false, message: '发送失败，请稍后重试' }
  }
}