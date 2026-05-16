// 交易安全校验云函数
// 实现诈骗风险预警系统

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 风险等级阈值配置
const RISK_THRESHOLDS = {
  TRUST_SCORE_MIN: 60,        // 最低信任分数
  TRANSACTION_LIMIT_LOW: 100, // 低风险交易限额
  TRANSACTION_LIMIT_MID: 500, // 中风险交易限额
  MAX_REPORT_COUNT: 3,       // 最大举报次数
  NEW_USER_DAYS: 7,          // 新用户天数判定
  RAPID_TRADE_COUNT: 3,      // 快速交易次数阈值
  RAPID_TRADE_HOURS: 2       // 快速交易时间窗口（小时）
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    switch (event.action) {
      case 'checkTransaction':
        return await checkTransaction(event, openid, wxContext)

      case 'reportTransaction':
        return await reportTransaction(event, openid, wxContext)

      case 'getRiskLevel':
        return await getRiskLevel(event, openid)

      case 'addTrustScore':
        return await addTrustScore(event, openid)

      case 'getUserRiskProfile':
        return await getUserRiskProfile(event, openid)

      case 'syncRiskToGoods':
        return await syncRiskToGoods(event, openid)

      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('[transactionSecurity] 错误:', err)
    return { success: false, message: '系统错误' }
  }
}

// 1. 检查交易安全性
async function checkTransaction(event, openid, wxContext) {
  const { goodsId, sellerOpenid, buyerOpenid, amount } = event
  const clientIP = wxContext.CLIENTIP || 'unknown'
  const now = db.serverDate()

  const riskResult = {
    safe: true,
    riskLevel: 'low',
    riskScore: 0,
    warnings: [],
    requiresVerification: false,
    blockReason: null
  }

  // 获取卖家信息
  const sellerRes = await db.collection('users').where({ openid: sellerOpenid }).get()
  if (sellerRes.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }
  const seller = sellerRes.data[0]

  // 获取买家信息
  const buyerRes = await db.collection('users').where({ openid: buyerOpenid }).get()
  const buyer = buyerRes.data.length > 0 ? buyerRes.data[0] : null

  // ========== 风险检测 ==========

  // 1.1 检查卖家信任等级
  if (seller.trustLevel < RISK_THRESHOLDS.TRUST_SCORE_MIN) {
    riskResult.safe = false
    riskResult.riskLevel = 'high'
    riskResult.riskScore += 40
    riskResult.warnings.push('卖家信任等级过低')
    riskResult.blockReason = '卖家账号存在风险，请谨慎交易'
  }

  // 1.2 检查卖家被举报次数
  const statsRes = await db.collection('user_stats').where({ openid: sellerOpenid }).get()
  if (statsRes.data.length > 0) {
    const stats = statsRes.data[0]
    if (stats.reportCount >= RISK_THRESHOLDS.MAX_REPORT_COUNT) {
      riskResult.safe = false
      riskResult.riskLevel = 'high'
      riskResult.riskScore += 50
      riskResult.warnings.push('卖家被多次举报')
      riskResult.blockReason = '该账号存在违规记录'
    }

    // 1.3 检查快速连续交易
    const recentTrades = await db.collection('transaction_records')
      .where({
        sellerOpenid,
        createTime: _.gt(new Date(Date.now() - RISK_THRESHOLDS.RAPID_TRADE_HOURS * 60 * 60 * 1000))
      })
      .count()

    if (recentTrades.total >= RISK_THRESHOLDS.RAPID_TRADE_COUNT) {
      riskResult.riskLevel = riskResult.riskLevel === 'high' ? 'high' : 'medium'
      riskResult.riskScore += 20
      riskResult.warnings.push('短时间内多次交易，请核实对方身份')
    }
  }

  // 1.4 检查新注册卖家
  if (seller.createTime) {
    const registerDays = (Date.now() - new Date(seller.createTime).getTime()) / (1000 * 60 * 60 * 24)
    if (registerDays < RISK_THRESHOLDS.NEW_USER_DAYS) {
      riskResult.riskScore += 15
      riskResult.warnings.push('卖家为新注册账号')
    }
  }

  // 1.5 检查商品价格异常
  if (amount && amount > RISK_THRESHOLDS.TRANSACTION_LIMIT_MID) {
    riskResult.riskScore += 10
    riskResult.warnings.push('大额交易，请使用平台担保交易')
  }

  // 1.6 检查买家是否为新用户
  if (buyer && buyer.createTime) {
    const buyerRegisterDays = (Date.now() - new Date(buyer.createTime).getTime()) / (1000 * 60 * 60 * 24)
    if (buyerRegisterDays < RISK_THRESHOLDS.NEW_USER_DAYS) {
      riskResult.riskScore += 10
      riskResult.warnings.push('买家为新注册账号')
    }
  }

  // 1.7 检查是否为自买自卖
  if (sellerOpenid === buyerOpenid) {
    riskResult.safe = false
    riskResult.riskLevel = 'high'
    riskResult.riskScore = 100
    riskResult.warnings.push('不能购买自己发布的商品')
    riskResult.blockReason = '交易异常'
  }

  // 1.8 检查商品是否属于高风险类别
  if (event.goodsCategory === '其他') {
    riskResult.riskScore += 5
    riskResult.warnings.push('此类商品交易需谨慎')
  }

  // 确定最终风险等级
  if (riskResult.riskScore >= 70) {
    riskResult.riskLevel = 'critical'
    riskResult.safe = false
    riskResult.requiresVerification = true
  } else if (riskResult.riskScore >= 40) {
    riskResult.riskLevel = 'high'
  } else if (riskResult.riskScore >= 20) {
    riskResult.riskLevel = 'medium'
  }

  // 记录风险检查结果
  await db.collection('transaction_risk_checks').add({
    data: {
      goodsId,
      sellerOpenid,
      buyerOpenid,
      amount,
      riskResult,
      clientIP,
      createTime: now
    }
  })

  // 如果风险等级为高或以上，发送预警
  if (riskResult.riskLevel === 'high' || riskResult.riskLevel === 'critical') {
    await sendRiskAlert({
      eventType: 'high_risk_transaction',
      severity: riskResult.riskLevel,
      openid: sellerOpenid,
      details: {
        goodsId,
        amount,
        riskScore: riskResult.riskScore,
        warnings: riskResult.warnings
      },
      clientIP
    })
  }

  return {
    success: true,
    data: riskResult
  }
}

// 2. 举报交易
async function reportTransaction(event, openid, wxContext) {
  const { reportedOpenid, reason, goodsId, description } = event
  const clientIP = wxContext.CLIENTIP || 'unknown'
  const now = db.serverDate()

  // 记录举报
  const reportRes = await db.collection('transaction_reports').add({
    data: {
      reporterOpenid: openid,
      reportedOpenid,
      goodsId,
      reason,
      description,
      status: 'pending',
      clientIP,
      createTime: now
    }
  })

  // 更新被举报用户的统计
  const statsRes = await db.collection('user_stats').where({ openid: reportedOpenid }).get()
  if (statsRes.data.length > 0) {
    await db.collection('user_stats').doc(statsRes.data[0]._id).update({
      data: {
        reportCount: _.inc(1),
        lastReportTime: now
      }
    })
  }

  // 检查是否达到举报阈值，触发风险预警
  if (statsRes.data.length > 0 && statsRes.data[0].reportCount + 1 >= RISK_THRESHOLDS.MAX_REPORT_COUNT) {
    await sendRiskAlert({
      eventType: 'user_report_threshold_reached',
      severity: 'critical',
      openid: reportedOpenid,
      details: {
        reportCount: statsRes.data[0].reportCount + 1,
        latestReport: reason
      },
      clientIP
    })

    // 降低用户信任分数
    await db.collection('user_stats').doc(statsRes.data[0]._id).update({
      data: { trustScore: _.inc(-30) }
    })
  }

  // 记录风险事件
  await logRiskEvent({
    openid: reportedOpenid,
    eventType: 'user_reported',
    severity: 'high',
    details: { reporterOpenid: openid, reason, goodsId },
    clientIP
  })

  return {
    success: true,
    message: '举报已提交，我们会尽快处理',
    reportId: reportRes._id
  }
}

// 3. 获取风险等级
async function getRiskLevel(event, openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  const statsRes = await db.collection('user_stats').where({ openid }).get()
  const stats = statsRes.data.length > 0 ? statsRes.data[0] : {
    trustScore: 100,
    reportCount: 0,
    transactionCount: 0
  }

  // 计算综合风险等级
  let riskLevel = 'low'
  let riskScore = 0

  if (stats.reportCount >= 3) riskScore += 40
  else if (stats.reportCount >= 1) riskScore += 15

  const user = userRes.data[0]
  if (user.trustLevel < 60) riskScore += 30
  else if (user.trustLevel < 80) riskScore += 10

  if (user.status === 'restricted') riskScore += 50

  if (riskScore >= 70) riskLevel = 'critical'
  else if (riskScore >= 40) riskLevel = 'high'
  else if (riskScore >= 20) riskLevel = 'medium'

  return {
    success: true,
    data: {
      riskLevel,
      riskScore,
      trustScore: stats.trustScore || 100,
      reportCount: stats.reportCount || 0,
      transactionCount: stats.transactionCount || 0
    }
  }
}

// 4. 增加信任分数（完成交易后）
async function addTrustScore(event, openid) {
  const { transactionId } = event

  const statsRes = await db.collection('user_stats').where({ openid }).get()
  if (statsRes.data.length === 0) {
    return { success: false, message: '用户统计不存在' }
  }

  const stats = statsRes.data[0]
  const currentScore = stats.trustScore || 0
  const newScore = Math.min(currentScore + 5, 100)

  // 更新交易记录
  await db.collection('transaction_records').doc(transactionId).update({
    data: { trustScoreAdded: true }
  })

  // 增加信任分数（每次交易最多+5分，上限100）
  await db.collection('user_stats').doc(stats._id).update({
    data: {
      trustScore: newScore,
      transactionCount: _.inc(1),
      lastTransactionTime: db.serverDate()
    }
  })

  return { success: true, message: '信任分数已更新' }
}

// 5. 获取用户风险画像
async function getUserRiskProfile(event, openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }
  const user = userRes.data[0]

  const statsRes = await db.collection('user_stats').where({ openid }).get()
  const stats = statsRes.data.length > 0 ? statsRes.data[0] : null

  // 获取最近的风险事件
  const riskEventsRes = await db.collection('risk_events')
    .where({ openid })
    .orderBy('timestamp', 'desc')
    .limit(5)
    .get()

  // 获取被举报记录
  const reportsRes = await db.collection('transaction_reports')
    .where({ reportedOpenid: openid, status: 'pending' })
    .count()

  // 获取交易记录
  const transactionsRes = await db.collection('transaction_records')
    .where(_.or([
      { sellerOpenid: openid },
      { buyerOpenid: openid }
    ]))
    .count()

  // 构建风险画像
  const profile = {
    userId: user._id,
    studentId: user.studentId,
    nickname: user.nickname,
    riskLevel: 'low',
    riskFactors: [],
    stats: {
      trustScore: stats ? stats.trustScore : 100,
      reportCount: stats ? stats.reportCount : 0,
      transactionCount: transactionsRes.total,
      pendingReports: reportsRes.total
    },
    recentRiskEvents: riskEventsRes.data.map(e => ({
      type: e.eventType,
      severity: e.severity,
      timestamp: e.timestamp,
      status: e.status
    })),
    accountAge: user.createTime
      ? Math.floor((Date.now() - new Date(user.createTime).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    isVerified: user.studentIdVerified || false,
    status: user.status || 'active'
  }

  // 计算风险等级
  if (profile.stats.reportCount >= 3 || profile.stats.trustScore < 60) {
    profile.riskLevel = 'high'
    profile.riskFactors.push('存在违规记录或低信任分数')
  } else if (profile.stats.reportCount >= 1 || profile.stats.trustScore < 80) {
    profile.riskLevel = 'medium'
    profile.riskFactors.push('存在少量负面记录')
  }

  if (profile.status === 'restricted') {
    profile.riskLevel = 'critical'
    profile.riskFactors.push('账号处于受限状态')
  }

  return { success: true, data: profile }
}

// 6. 同步风险信息到商品
async function syncRiskToGoods(event, openid) {
  const { goodsId } = event

  // 获取用户风险等级
  const profileResult = await getUserRiskProfile({}, openid)
  if (!profileResult.success) {
    return profileResult
  }

  // 更新商品风险标记
  await db.collection('goods').doc(goodsId).update({
    data: {
      sellerRiskLevel: profileResult.data.riskLevel,
      sellerTrustScore: profileResult.data.stats.trustScore
    }
  })

  return { success: true }
}

// 发送风险预警
async function sendRiskAlert(data) {
  const now = db.serverDate()

  const alert = {
    ...data,
    timestamp: now,
    status: 'unread',
    notifyAdmins: true
  }

  await db.collection('security_alerts').add({ data: alert })

  // 如果是高风险事件，同时记录到风险事件表
  if (data.severity === 'critical' || data.severity === 'high') {
    await logRiskEvent({
      openid: data.openid,
      eventType: data.eventType,
      severity: data.severity,
      details: data.details,
      clientIP: data.clientIP
    })
  }

  return alert
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
