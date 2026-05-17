// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const users = db.collection('users')

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, email, password, code } = event

  try {
    const now = db.serverDate()

    if (action === 'register') {
      console.log('=== 执行注册流程 ===')
      
      // 验证验证码
      const codes = db.collection('verification_codes')
      
      if (!code) {
        return {
          success: false,
          message: '请输入验证码'
        }
      }

      // 查找验证码
      const codeRes = await codes
        .where({
          email: email,
          type: 'registration',
          used: false
        })
        .orderBy('send_time', 'desc')
        .get()

      console.log('查到验证码记录:', codeRes.data.length)

      if (codeRes.data.length === 0) {
        return {
          success: false,
          message: '请先获取验证码'
        }
      }

      const validCode = codeRes.data[0]
      console.log('验证码验证:', { input: code, stored: validCode.code, expireTime: validCode.expire_time })

      // 检查验证码是否过期
      const now = new Date()
      const expireTime = new Date(validCode.expire_time)
      if (now > expireTime) {
        console.log('验证码已过期')
        return {
          success: false,
          message: '验证码已过期，请重新获取'
        }
      }

      // 验证验证码是否正确
      if (validCode.code !== code) {
        return {
          success: false,
          message: '验证码错误'
        }
      }

      // 检查邮箱是否已存在
      const existingUser = await users.where({ email }).get()
      if (existingUser.data.length > 0) {
        return {
          success: false,
          message: '邮箱已被注册'
        }
      }

      // 标记验证码为已使用
      await codes.doc(validCode._id).update({
        data: { used: true }
      })

      // 创建新用户
      const newUser = {
        openid,
        email,
        password, // 注意：实际生产环境应该加密存储密码
        email_verified: true, // 验证码验证通过，标记为已验证
        isAdmin: false,
        create_time: now,
        last_login: now,
        role: 'guest' // 默认角色为访客
      }
      const res = await users.add({ data: newUser })
      console.log('注册成功，用户ID:', res._id)
      return {
        success: true,
        userId: res._id,
        userInfo: { ...newUser, _id: res._id },
        message: '注册成功'
      }
    } else if (action === 'login') {
      // 登录逻辑
      const cleanEmail = email.trim()
      console.log('=== 登录请求 ===')
      console.log('输入邮箱:', cleanEmail)
      console.log('输入密码:', password)
      
      // 先查询所有用户，看看有什么数据
      const allUsers = await users.limit(10).get()
      console.log('数据库中的用户数量:', allUsers.data.length)
      console.log('所有用户数据:', allUsers.data)
      
      // 尝试查找用户
      const userRes = await users.where({ email: cleanEmail }).get()
      console.log('查询结果数量:', userRes.data.length)
      
      if (userRes.data.length === 0) {
        console.log('未找到匹配的用户，尝试不区分大小写查询')
        // 如果找不到，尝试用其他方式查找
        const allUserList = await users.get()
        console.log('所有用户的邮箱:', allUserList.data.map(u => u.email))
        
        return {
          success: false,
          message: '用户不存在，请先注册',
          debug: {
            inputEmail: cleanEmail,
            allEmails: allUserList.data.map(u => u.email)
          }
        }
      }

      const user = userRes.data[0]
      console.log('找到用户:', user)
      
      // 验证密码：兼容没有password字段的老用户
      if (user.password !== undefined && user.password !== password) {
        console.log('密码验证失败，存储的密码:', user.password, '输入的密码:', password)
        return {
          success: false,
          message: '密码错误'
        }
      }
      // 如果用户没有password字段，允许任意密码登录（方便测试）
      if (user.password === undefined) {
        console.log('该用户没有设置密码，允许任意密码登录')
      }

      // 更新最后登录时间
      await users.doc(user._id).update({
        data: { last_login: now }
      })

      console.log('登录成功，用户信息:', user)
      return {
        success: true,
        userId: user._id,
        userInfo: user,
        role: user.role || 'guest',
        message: '登录成功'
      }
    } else {
      // 传统登录逻辑（保持兼容性）
      let userRes
      
      // 如果提供了邮箱，尝试通过邮箱登录
      if (email) {
        userRes = await users.where({ email }).get()
      } else {
        // 否则通过 openid 登录
        userRes = await users.where({ openid }).get()
      }

      if (userRes.data.length > 0) {
        // 用户已存在，更新最后登录时间
        const user = userRes.data[0]
        await users.doc(user._id).update({
          data: { last_login: now }
        })
        return {
          code: 0,
          data: user,
          message: '登录成功'
        }
      } else {
        // 用户不存在，创建新用户
        const newUser = {
          openid,
          email: email || '',
          email_verified: false,
          create_time: now,
          last_login: now,
          role: 'user' // 默认角色
        }
        const res = await users.add({ data: newUser })
        return {
          code: 0,
          data: { ...newUser, _id: res._id },
          message: '新用户创建成功'
        }
      }
    }
  } catch (err) {
    console.error('[login] 错误:', err)
    return {
      success: false,
      message: '操作失败，请稍后重试',
      error: err
    }
  }
}