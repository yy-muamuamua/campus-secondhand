// 获取聊天列表云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取所有参与的会话
    const result = await db.collection('conversations')
      .where({ participants: openid })
      .orderBy('updateTime', 'desc')
      .get()

    // 获取对方用户信息和商品信息
    const conversationsWithInfo = await Promise.all(
      result.data.map(async conversation => {
        // 获取对方用户
        const targetOpenid = conversation.participants.find(p => p !== openid)
        const userRes = await db.collection('users')
          .where({ openid: targetOpenid })
          .field({ nickname: true, avatar: true })
          .get()
        
        // 获取商品信息
        let goodsInfo = null
        if (conversation.goodsId) {
          const goodsRes = await db.collection('goods')
            .doc(conversation.goodsId)
            .field({ title: true, images: true, price: true })
            .get()
          goodsInfo = goodsRes.data
        }

        return {
          ...conversation,
          targetUser: userRes.data[0] || {},
          goodsInfo,
          unreadCount: conversation.unreadCount?.[openid] || 0
        }
      })
    )

    return {
      success: true,
      data: conversationsWithInfo
    }

  } catch (error) {
    console.error('[getConversationList] Error:', error)
    return { success: false, code: 10001, message: '系统错误' }
  }
}