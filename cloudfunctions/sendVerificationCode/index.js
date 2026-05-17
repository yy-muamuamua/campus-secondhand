const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const codes = db.collection('verification_codes')

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { email, type } = event // type: 'registration' 或 'student_verification'
  
  console.log('=== sendVerificationCode 开始 ===')
  console.log('参数:', { email, type })

  // 如果是学生认证，验证邮箱格式
  if (type === 'student_verification') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return { success: false, message: '邮箱格式不正确' }
    }
  }

  // 生成验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const now = new Date()
  const expireTime = new Date(now.getTime() + 5 * 60 * 1000)

  try {
    // 保存验证码到数据库
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

    console.log('验证码保存成功:', { email, code })

    // 检查是否配置了邮件服务
    const hasEmailConfig = process.env.MAIL_USER && process.env.MAIL_PASS

    if (hasEmailConfig) {
      // 有配置 → 发送真实邮件
      try {
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

        const subject = type === 'student_verification' ? '学号验证码' : '注册验证码'
        const text = `您的验证码是：${code}，请在5分钟内完成${type === 'student_verification' ? '学生认证' : '注册'}。`

        await transporter.sendMail({
          from: `"校园二手" <${process.env.MAIL_USER}>`,
          to: email,
          subject: subject,
          text: text
        })

        console.log('邮件发送成功')
        return { success: true, message: '验证码已发送，请查收邮件' }
      } catch (mailErr) {
        console.error('邮件发送失败:', mailErr)
        // 邮件发送失败也不影响，返回测试模式提示
        return { 
          success: true, 
          message: `验证码已生成（邮件服务暂时不可用，测试验证码：${code}）` 
        }
      }
    } else {
      // 没有配置 → 测试模式
      console.log('未配置邮件服务，使用测试模式')
      return { 
        success: true, 
        message: `验证码已生成（测试模式：${code}）` 
      }
    }
  } catch (err) {
    console.error('[sendVerificationCode] 错误:', err)
    return { success: false, message: '发送失败，请稍后重试' }
  }
}
