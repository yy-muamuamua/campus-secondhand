// 发送消息云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { targetOpenid, content, goodsId } = event

    // 获取双方用户信息
    const userRes = await db.collection('users')
      .where({ openid: db.command.in([openid, targetOpenid]) })
      .field({ openid: true, nickname: true, avatar: true })
      .get()

    const sender = userRes.data.find(u => u.openid === openid)
    const receiver = userRes.data.find(u => u.openid === targetOpenid)

    if (!sender || !receiver) {
      return { success: false, code: 10003, message: '用户不存在' }
    }

    // 获取或创建会话
    let conversation = await getOrCreateConversation(openid, targetOpenid, goodsId)

    // 创建消息记录
    const messageData = {
      conversationId: conversation._id,
      senderOpenid: openid,
      content,
      type: 'text',
      isRead: false,
      createTime: db.serverDate()
    }

    const messageResult = await db.collection('messages').add({ data: messageData })

    // 更新会话的最后消息
    await db.collection('conversations').doc(conversation._id).update({
      data: {
        lastMessage: {
          content: content.length > 50 ? content.substring(0, 50) + '...' : content,
          type: 'text',
          sendTime: db.serverDate()
        },
        unreadCount: {
          [openid]: 0,
          [targetOpenid]: (conversation.unreadCount?.[targetOpenid] || 0) + 1
        },
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        messageId: messageResult._id,
        conversationId: conversation._id
      }
    }

  } catch (error) {
    console.error('[sendMessage] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}

// 获取或创建会话
async function getOrCreateConversation(openid1, openid2, goodsId) {
  // 查找现有会话
  const participants = [openid1, openid2].sort()
  
  const result = await db.collection('conversations')
    .where({ 
      participants,
      goodsId 
    })
    .get()

  if (result.data.length > 0) {
    return result.data[0]
  }

  // 创建新会话
  const conversationData = {
    participants,
    goodsId,
    lastMessage: {},
    unreadCount: {
      [openid1]: 0,
      [openid2]: 0
    },
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }

  const createResult = await db.collection('conversations').add({ data: conversationData })
  return { _id: createResult._id, ...conversationData }
}