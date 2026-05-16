// 标记消息已读云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { conversationId } = event

    // 获取会话信息
    const conversationRes = await db.collection('conversations').doc(conversationId).get()
    if (!conversationRes.data) {
      return { success: false, code: 40001, message: '会话不存在' }
    }

    const conversation = conversationRes.data

    // 检查权限
    if (!conversation.participants.includes(openid)) {
      return { success: false, code: 10003, message: '未授权访问' }
    }

    // 更新会话未读计数
    const newUnreadCount = { ...conversation.unreadCount, [openid]: 0 }
    await db.collection('conversations').doc(conversationId).update({
      data: { unreadCount: newUnreadCount }
    })

    // 更新消息已读状态
    await db.collection('messages')
      .where({ conversationId, isRead: false })
      .update({ data: { isRead: true } })

    return {
      success: true,
      message: '已标记为已读'
    }

  } catch (error) {
    console.error('[markAsRead] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}