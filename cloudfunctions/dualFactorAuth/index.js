// 双重因素身份认证核心云函数
// 基于学号与验证码的身份确认机制

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, studentId, email, code, password, nickname } = event

  try {
    const now = db.serverDate()
    const clientIP = wxContext.CLIENTIP || 'unknown'

    switch (action) {
      case 'sendCode':
        return await handleSendCode(studentId, email, clientIP, now)

      case 'verifyStudentId':
        return await handleVerifyStudentId(openid, studentId, email, code, clientIP, now)

      case 'register':
        return await handleRegister(openid, studentId, email, password, nickname, clientIP, now)

      case 'login':
        return await handleLogin(studentId, email, password, clientIP, now)

      case 'verifyExistingUser':
        return await handleVerifyExistingUser(openid, email, code, clientIP, now)

      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('[dualFactorAuth] 错误:', err)
    await logRiskEvent({
      openid,
      eventType: 'system_error',
      severity: 'high',
      details: { error: err.message, action },
      clientIP: wxContext.CLIENTIP
    })
    return { success: false, message: '系统错误，请稍后重试' }
  }
}

// 1. 发送验证码
async function handleSendCode(studentId, email, clientIP, now) {
  // 检查学号是否已被注册
  const existingStudent = await db.collection('users').where({ studentId }).get()
  if (existingStudent.data.length > 0) {
    await logAuthEvent({
      openid: 'unknown',
      eventType: 'code_request_blocked',
      reason: '学号已被注册',
      studentId,
      clientIP,
      result: 'blocked'
    })
    return { success: false, message: '该学号已被注册', code: 'STUDENT_ID_EXISTS' }
  }

  // 检查邮箱格式
  if (!email || !email.includes('@')) {
    return { success: false, message: '请输入有效的邮箱地址' }
  }

  // 生成6位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expireTime = new Date(Date.now() + 10 * 60 * 1000) // 10分钟有效期

  // 存储验证码
  await db.collection('verification_codes').add({
    data: {
      studentId,
      email,
      code,
      type: 'dual_factor_auth',
      expireTime,
      used: false,
      createdAt: now
    }
  })

  // 记录发送日志
  await logAuthEvent({
    openid: 'unknown',
    eventType: 'code_sent',
    studentId,
    email,
    clientIP,
    result: 'success'
  })

  // 发送邮件（实际项目中需要配置邮件服务）
  console.log(`[验证码] 学号: ${studentId}, 邮箱: ${email}, 验证码: ${code}`)

  return {
    success: true,
    message: '验证码已发送到您的邮箱',
    expireMinutes: 10
  }
}

// 2. 验证学号与验证码
async function handleVerifyStudentId(openid, studentId, email, code, clientIP, now) {
  // 查找有效验证码
  const codeRes = await db.collection('verification_codes').where({
    studentId,
    email,
    code,
    type: 'dual_factor_auth',
    used: false,
    expireTime: _.gt(new Date())
  }).get()

  if (codeRes.data.length === 0) {
    await logRiskEvent({
      openid,
      eventType: 'invalid_verification_code',
      severity: 'medium',
      details: { studentId, email },
      clientIP
    })
    await logAuthEvent({
      openid,
      eventType: 'verify_failed',
      reason: '验证码无效或已过期',
      studentId,
      clientIP,
      result: 'failed'
    })
    return { success: false, message: '验证码无效或已过期', code: 'INVALID_CODE' }
  }

  // 检查学号唯一性（双重检查）
  const studentCheck = await db.collection('users').where({ studentId }).get()
  if (studentCheck.data.length > 0) {
    await logRiskEvent({
      openid,
      eventType: 'student_id_duplicate_attempt',
      severity: 'high',
      details: { studentId, attemptedOpenid: openid },
      clientIP
    })
    return { success: false, message: '该学号已被其他账号绑定', code: 'DUPLICATE_STUDENT_ID' }
  }

  // 标记验证码已使用
  await db.collection('verification_codes').doc(codeRes.data[0]._id).update({
    data: { used: true, usedAt: now }
  })

  // 创建临时认证记录
  await db.collection('temp_auth_records').add({
    data: {
      openid,
      studentId,
      email,
      verified: true,
      verifiedAt: now,
      expireTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟内完成注册
      clientIP
    }
  })

  await logAuthEvent({
    openid,
    eventType: 'student_id_verified',
    studentId,
    clientIP,
    result: 'success'
  })

  return {
    success: true,
    message: '学号验证成功，请完成注册',
    verified: true
  }
}

// 3. 完成注册
async function handleRegister(openid, studentId, email, password, nickname, clientIP, now) {
  // 检查临时认证记录
  const tempAuth = await db.collection('temp_auth_records').where({
    openid,
    studentId,
    email,
    verified: true,
    expireTime: _.gt(new Date())
  }).get()

  if (tempAuth.data.length === 0) {
    await logRiskEvent({
      openid,
      eventType: 'unverified_registration_attempt',
      severity: 'high',
      details: { studentId, email },
      clientIP
    })
    return { success: false, message: '请先完成学号验证', code: 'NOT_VERIFIED' }
  }

  // 再次检查学号唯一性
  const studentCheck = await db.collection('users').where({ studentId }).get()
  if (studentCheck.data.length > 0) {
    await logRiskEvent({
      openid,
      eventType: 'race_condition_duplicate_registration',
      severity: 'critical',
      details: { studentId },
      clientIP
    })
    return { success: false, message: '该学号已被注册', code: 'DUPLICATE_STUDENT_ID' }
  }

  // 检查邮箱唯一性
  const emailCheck = await db.collection('users').where({ email }).get()
  if (emailCheck.data.length > 0) {
    await logRiskEvent({
      openid,
      eventType: 'duplicate_email_registration',
      severity: 'high',
      details: { email, studentId },
      clientIP
    })
    return { success: false, message: '该邮箱已被注册', code: 'DUPLICATE_EMAIL' }
  }

  // 创建用户
  const newUser = {
    openid,
    studentId,
    email,
    password, // 实际生产环境需要加密
    nickname: nickname || `用户${studentId.slice(-4)}`,
    role: 'student',
    studentIdVerified: true,
    emailVerified: true,
    createTime: now,
    lastLoginTime: now,
    registerIP: clientIP,
    status: 'active',
    trustLevel: 1, // 初始信任等级
    riskScore: 0
  }

  const userRes = await db.collection('users').add({ data: newUser })

  // 删除临时认证记录
  await db.collection('temp_auth_records').doc(tempAuth.data[0]._id).remove()

  // 记录注册成功
  await logAuthEvent({
    openid,
    eventType: 'registration_completed',
    studentId,
    email,
    clientIP,
    result: 'success'
  })

  // 初始化用户统计
  await db.collection('user_stats').add({
    data: {
      userId: userRes._id,
      openid,
      goodsCount: 0,
      transactionCount: 0,
      trustScore: 100,
      reportCount: 0,
      createdAt: now
    }
  })

  return {
    success: true,
    message: '注册成功',
    userId: userRes._id,
    user: {
      studentId,
      email,
      nickname: newUser.nickname,
      role: 'student'
    }
  }
}

// 4. 登录
async function handleLogin(studentId, email, password, clientIP, now) {
  // 通过学号或邮箱查询用户
  let userRes
  if (studentId) {
    userRes = await db.collection('users').where({ studentId }).get()
  } else if (email) {
    userRes = await db.collection('users').where({ email }).get()
  } else {
    return { success: false, message: '请输入学号或邮箱' }
  }

  if (userRes.data.length === 0) {
    await logRiskEvent({
      openid: 'unknown',
      eventType: 'login_user_not_found',
      severity: 'medium',
      details: { studentId, email },
      clientIP
    })
    return { success: false, message: '用户不存在', code: 'USER_NOT_FOUND' }
  }

  const user = userRes.data[0]

  // 检查账号状态
  if (user.status === 'banned') {
    await logRiskEvent({
      openid: user.openid,
      eventType: 'banned_user_login_attempt',
      severity: 'critical',
      details: { studentId },
      clientIP
    })
    return { success: false, message: '账号已被封禁', code: 'ACCOUNT_BANNED' }
  }

  // 验证密码
  if (user.password !== password) {
    await logRiskEvent({
      openid: user.openid,
      eventType: 'wrong_password',
      severity: 'medium',
      details: { studentId },
      clientIP
    })
    await logAuthEvent({
      openid: user.openid,
      eventType: 'login_failed',
      reason: '密码错误',
      studentId,
      clientIP,
      result: 'failed'
    })
    return { success: false, message: '密码错误', code: 'WRONG_PASSWORD' }
  }

  // 登录成功，更新登录信息
  await db.collection('users').doc(user._id).update({
    data: {
      lastLoginTime: now,
      lastLoginIP: clientIP,
      loginCount: _.inc(1)
    }
  })

  await logAuthEvent({
    openid: user.openid,
    eventType: 'login_success',
    studentId,
    clientIP,
    result: 'success'
  })

  return {
    success: true,
    message: '登录成功',
    userId: user._id,
    user: {
      studentId: user.studentId,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      trustLevel: user.trustLevel
    }
  }
}

// 5. 验证已存在用户（用于绑定学号）
async function handleVerifyExistingUser(openid, email, code, clientIP, now) {
  // 查找有效验证码
  const codeRes = await db.collection('verification_codes').where({
    email,
    code,
    type: 'dual_factor_auth',
    used: false,
    expireTime: _.gt(new Date())
  }).get()

  if (codeRes.data.length === 0) {
    return { success: false, message: '验证码无效或已过期' }
  }

  // 标记验证码已使用
  await db.collection('verification_codes').doc(codeRes.data[0]._id).update({
    data: { used: true, usedAt: now }
  })

  await logAuthEvent({
    openid,
    eventType: 'existing_user_verified',
    email,
    clientIP,
    result: 'success'
  })

  return { success: true, message: '验证成功' }
}

// 记录认证事件日志
async function logAuthEvent(data) {
  try {
    await db.collection('auth_logs').add({
      data: {
        ...data,
        timestamp: db.serverDate()
      }
    })
  } catch (err) {
    console.error('[logAuthEvent] 错误:', err)
  }
}

// 记录风险事件
async function logRiskEvent(data) {
  try {
    await db.collection('risk_events').add({
      data: {
        ...data,
        timestamp: db.serverDate(),
        status: 'pending',
        handledBy: null,
        handleTime: null,
        resolution: null
      }
    })
  } catch (err) {
    console.error('[logRiskEvent] 错误:', err)
  }
}
