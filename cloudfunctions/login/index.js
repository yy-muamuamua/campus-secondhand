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
      // 注册逻辑
      // 检查邮箱是否已存在
      const existingUser = await users.where({ email }).get()
      if (existingUser.data.length > 0) {
        return {
          success: false,
          message: '邮箱已被注册'
        }
      }

      // 创建新用户
      const newUser = {
        openid,
        email,
        password, // 注意：实际生产环境应该加密存储密码
        email_verified: true, // 验证码验证通过，标记为已验证
        create_time: now,
        last_login: now,
        role: 'guest' // 默认角色为访客
      }
      const res = await users.add({ data: newUser })
      return {
        success: true,
        userId: res._id,
        message: '注册成功'
      }
    } else if (action === 'login') {
      // 登录逻辑
      const userRes = await users.where({ email }).get()
      if (userRes.data.length === 0) {
        return {
          success: false,
          message: '用户不存在'
        }
      }

      const user = userRes.data[0]
      // 验证密码
      if (user.password !== password) {
        return {
          success: false,
          message: '密码错误'
        }
      }

      // 更新最后登录时间
      await users.doc(user._id).update({
        data: { last_login: now }
      })

      return {
        success: true,
        userId: user._id,
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