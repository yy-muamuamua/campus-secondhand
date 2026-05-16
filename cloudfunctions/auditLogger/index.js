// 审计日志云函数
// 完整记录所有身份验证过程、风险事件及处理结果

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    switch (event.action) {
      case 'log':
        return await logEvent(event, openid, wxContext)

      case 'query':
        return await queryLogs(event, openid)

      case 'getRiskEvents':
        return await getRiskEvents(event, openid)

      case 'handleRiskEvent':
        return await handleRiskEvent(event, openid)

      case 'getAuditTrail':
        return await getAuditTrail(event, openid)

      case 'exportLogs':
        return await exportLogs(event, openid)

      case 'getStatistics':
        return await getStatistics(event, openid)

      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('[auditLogger] 错误:', err)
    return { success: false, message: '系统错误' }
  }
}

// 1. 记录事件
async function logEvent(event, openid, wxContext) {
  const { eventType, category, details, severity } = event
  const clientIP = wxContext.CLIENTIP || 'unknown'
  const now = db.serverDate()

  const logEntry = {
    eventType,
    category: category || 'general', // auth, transaction, security, system
    openid,
    details,
    severity: severity || 'info', // debug, info, warning, error, critical
    clientIP,
    userAgent: wxContext.USERAGENT || 'unknown',
    timestamp: now
  }

  // 根据事件类型分类记录
  switch (category) {
    case 'auth':
      await db.collection('auth_logs').add({ data: logEntry })
      break
    case 'risk':
      await db.collection('risk_events').add({
        data: {
          ...logEntry,
          status: 'pending',
          handledBy: null,
          handleTime: null,
          resolution: null
        }
      })
      break
    case 'transaction':
      await db.collection('transaction_records').add({ data: logEntry })
      break
    case 'security':
      await db.collection('security_logs').add({ data: logEntry })
      break
    default:
      await db.collection('audit_logs').add({ data: logEntry })
  }

  return { success: true, message: '事件已记录' }
}

// 2. 查询日志
async function queryLogs(event, openid) {
  const {
    category,
    startTime,
    endTime,
    page = 1,
    pageSize = 20
  } = event

  let collection
  switch (category) {
    case 'auth': collection = 'auth_logs'; break
    case 'risk': collection = 'risk_events'; break
    case 'transaction': collection = 'transaction_records'; break
    case 'security': collection = 'security_logs'; break
    default: collection = 'audit_logs'
  }

  const query = {}

  // 时间范围筛选
  if (startTime || endTime) {
    query.timestamp = {}
    if (startTime) query.timestamp.gte = new Date(startTime)
    if (endTime) query.timestamp.lte = new Date(endTime)
  }

  const skip = (page - 1) * pageSize

  const res = await db.collection(collection)
    .where(query)
    .orderBy('timestamp', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  const countRes = await db.collection(collection).where(query).count()

  return {
    success: true,
    data: {
      list: res.data,
      total: countRes.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRes.total / pageSize)
    }
  }
}

// 3. 获取风险事件列表
async function getRiskEvents(event, openid) {
  const { status, severity, startTime, endTime, page = 1, pageSize = 20 } = event

  const query = {}

  // 管理员可以查看所有事件，普通用户只能查看自己的
  const userRes = await db.collection('users').where({ openid }).get()
  const isAdmin = userRes.data.length > 0 && userRes.data[0].role === 'admin'

  if (!isAdmin) {
    query.openid = openid
  }

  if (status) query.status = status
  if (severity) query.severity = severity

  if (startTime || endTime) {
    query.timestamp = {}
    if (startTime) query.timestamp.gte = new Date(startTime)
    if (endTime) query.timestamp.lte = new Date(endTime)
  }

  const skip = (page - 1) * pageSize

  const res = await db.collection('risk_events')
    .where(query)
    .orderBy('timestamp', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  const countRes = await db.collection('risk_events').where(query).count()

  // 获取待处理事件统计
  const pendingCount = await db.collection('risk_events')
    .where({ status: 'pending' })
    .count()

  return {
    success: true,
    data: {
      list: res.data,
      total: countRes.total,
      pendingCount: pendingCount.total,
      page,
      pageSize
    }
  }
}

// 4. 处理风险事件
async function handleRiskEvent(event, openid) {
  const { eventId, resolution, action } = event
  const now = db.serverDate()

  // 验证管理员权限
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 'admin') {
    return { success: false, message: '无权限操作', code: 'NO_PERMISSION' }
  }

  // 获取事件信息
  const eventRes = await db.collection('risk_events').doc(eventId).get()
  if (!eventRes.data) {
    return { success: false, message: '事件不存在' }
  }

  const riskEvent = eventRes.data

  // 更新事件处理状态
  await db.collection('risk_events').doc(eventId).update({
    data: {
      status: 'handled',
      handledBy: openid,
      handleTime: now,
      resolution
    }
  })

  // 根据处理操作执行相应措施
  if (action) {
    switch (action) {
      case 'ban_user':
        await db.collection('users').where({ openid: riskEvent.openid }).update({
          data: { status: 'banned' }
        })
        await logAdminAction({
          adminOpenid: openid,
          action: 'ban_user',
          targetOpenid: riskEvent.openid,
          eventId,
          reason: resolution
        })
        break

      case 'restrict_user':
        await db.collection('users').where({ openid: riskEvent.openid }).update({
          data: { status: 'restricted' }
        })
        await logAdminAction({
          adminOpenid: openid,
          action: 'restrict_user',
          targetOpenid: riskEvent.openid,
          eventId,
          reason: resolution
        })
        break

      case 'warning':
        await db.collection('user_warnings').add({
          data: {
            openid: riskEvent.openid,
            eventId,
            reason: resolution,
            createTime: now
          }
        })
        break

      case 'clear_user_risk':
        // 清除用户风险标记
        const statsRes = await db.collection('user_stats').where({ openid: riskEvent.openid }).get()
        if (statsRes.data.length > 0) {
          await db.collection('user_stats').doc(statsRes.data[0]._id).update({
            data: { reportCount: 0 }
          })
        }
        break
    }
  }

  // 记录管理员操作
  await logAdminAction({
    adminOpenid: openid,
    action: 'handle_risk_event',
    eventId,
    resolution
  })

  return { success: true, message: '事件已处理' }
}

// 5. 获取审计轨迹
async function getAuditTrail(event, openid) {
  const { targetOpenid, startTime, endTime } = event

  // 验证权限
  const userRes = await db.collection('users').where({ openid }).get()
  const isAdmin = userRes.data.length > 0 && userRes.data[0].role === 'admin'

  if (!isAdmin && openid !== targetOpenid) {
    return { success: false, message: '无权限查看', code: 'NO_PERMISSION' }
  }

  const query = { openid: targetOpenid }

  if (startTime || endTime) {
    query.timestamp = {}
    if (startTime) query.timestamp.gte = new Date(startTime)
    if (endTime) query.timestamp.lte = new Date(endTime)
  }

  // 获取各类日志
  const [authLogs, riskEvents, transactions, adminActions] = await Promise.all([
    db.collection('auth_logs').where(query).orderBy('timestamp', 'desc').limit(50).get(),
    db.collection('risk_events').where(query).orderBy('timestamp', 'desc').limit(50).get(),
    db.collection('transaction_records').where(query).orderBy('timestamp', 'desc').limit(50).get(),
    db.collection('admin_actions').where({ targetOpenid }).orderBy('timestamp', 'desc').limit(50).get()
  ])

  // 合并所有日志并按时间排序
  const allLogs = [
    ...authLogs.data.map(l => ({ ...l, logType: 'auth' })),
    ...riskEvents.data.map(l => ({ ...l, logType: 'risk' })),
    ...transactions.data.map(l => ({ ...l, logType: 'transaction' })),
    ...adminActions.data.map(l => ({ ...l, logType: 'admin_action' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return {
    success: true,
    data: {
      userOpenid: targetOpenid,
      logs: allLogs.slice(0, 100),
      summary: {
        totalAuthEvents: authLogs.data.length,
        totalRiskEvents: riskEvents.data.length,
        totalTransactions: transactions.data.length,
        totalAdminActions: adminActions.data.length
      }
    }
  }
}

// 6. 导出日志
async function exportLogs(event, openid) {
  const { format, startTime, endTime, categories } = event

  // 验证管理员权限
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 'admin') {
    return { success: false, message: '无权限操作', code: 'NO_PERMISSION' }
  }

  const query = {}
  if (startTime || endTime) {
    query.timestamp = {}
    if (startTime) query.timestamp.gte = new Date(startTime)
    if (endTime) query.timestamp.lte = new Date(endTime)
  }

  const results = {}

  if (!categories || categories.includes('auth')) {
    const res = await db.collection('auth_logs').where(query).orderBy('timestamp', 'desc').get()
    results.authLogs = res.data
  }

  if (!categories || categories.includes('risk')) {
    const res = await db.collection('risk_events').where(query).orderBy('timestamp', 'desc').get()
    results.riskEvents = res.data
  }

  if (!categories || categories.includes('security')) {
    const res = await db.collection('security_logs').where(query).orderBy('timestamp', 'desc').get()
    results.securityLogs = res.data
  }

  // 记录导出操作
  await logAdminAction({
    adminOpenid: openid,
    action: 'export_logs',
    details: { format, startTime, endTime, categories }
  })

  return {
    success: true,
    data: {
      ...results,
      exportedAt: new Date().toISOString(),
      timeRange: { startTime, endTime }
    }
  }
}

// 7. 获取统计信息
async function getStatistics(event, openid) {
  const { period = '7d' } = event

  // 验证管理员权限
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 'admin') {
    return { success: false, message: '无权限操作', code: 'NO_PERMISSION' }
  }

  // 计算时间范围
  let startTime
  const now = new Date()
  switch (period) {
    case '24h': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break
    case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
    case '30d': startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
    default: startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  const query = { timestamp: _.gte(startTime) }

  // 并行获取各类统计
  const [
    authCount,
    riskCount,
    pendingRiskCount,
    transactionCount
  ] = await Promise.all([
    db.collection('auth_logs').where(query).count(),
    db.collection('risk_events').where(query).count(),
    db.collection('risk_events').where({ status: 'pending' }).count(),
    db.collection('transaction_records').where(query).count()
  ])

  // 获取风险等级分布
  const riskByLevel = await db.collection('risk_events')
    .where(query)
    .groupBy('severity')
    .limit(100)
    .get()

  // 获取Top风险用户
  const topRiskUsers = await db.collection('risk_events')
    .where(query)
    .groupBy('openid')
    .limit(10)
    .get()

  return {
    success: true,
    data: {
      period,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      statistics: {
        totalAuthEvents: authCount.total,
        totalRiskEvents: riskCount.total,
        pendingRiskEvents: pendingRiskCount.total,
        totalTransactions: transactionCount.total
      },
      riskDistribution: riskByLevel.data,
      topRiskUsers: topRiskUsers.data
    }
  }
}

// 记录管理员操作
async function logAdminAction(data) {
  await db.collection('admin_actions').add({
    data: {
      ...data,
      timestamp: db.serverDate()
    }
  })
}
