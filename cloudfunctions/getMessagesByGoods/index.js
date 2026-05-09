const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const messages = db.collection('messages')
const users = db.collection('users')
const _ = db.command

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const { goodsId } = event
  if (!goodsId) {
    return { code: -1, message: '缺少商品ID' }
  }

  try {
    // 查询该商品的所有留言，按时间正序
    const msgRes = await messages.where({
      goods_id: goodsId
    }).orderBy('create_time', 'asc').get()

    const list = msgRes.data

    // 获取所有留言者的用户信息（昵称、头像）
    const userIds = [...new Set(list.map(m => m.user_id))]
    const userRes = await users.where({
      _id: _.in(userIds)
    }).get()
    const userMap = {}
    userRes.data.forEach(u => {
      userMap[u._id] = {
        nickname: u.nickname || '微信用户',
        avatar: u.avatar || ''
      }
    })

    // 组装数据
    const result = list.map(m => ({
      ...m,
      userInfo: userMap[m.user_id] || { nickname: '未知用户', avatar: '' }
    }))

    return { code: 0, data: result }
  } catch (err) {
    console.error(err)
    return { code: -1, message: '获取留言失败' }
  }
}