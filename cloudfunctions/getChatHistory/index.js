// 获取聊天历史云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { conversationId, page = 0, size = 20 } = event

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

    // 获取消息列表
    const messagesRes = await db.collection('messages')
      .where({ conversationId })
      .orderBy('createTime', 'desc')
      .skip(page * size)
      .limit(size)
      .get()

    // 获取对方用户信息
    const targetOpenid = conversation.participants.find(p => p !== openid)
    const userRes = await db.collection('users')
      .where({ openid: targetOpenid })
      .field({ nickname: true, avatar: true })
      .get()

    return {
      success: true,
      data: {
        messages: messagesRes.data.reverse(),
        targetUser: userRes.data[0] || {},
        conversation
      }
    }

  } catch (error) {
    console.error('[getChatHistory] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}