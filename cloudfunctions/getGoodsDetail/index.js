const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')
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
    // 增加浏览次数（原子操作）
    await goods.doc(goodsId).update({
      data: {
        views: _.inc(1)
      }
    })

    // 获取商品详情
    const goodsRes = await goods.doc(goodsId).get()
    if (!goodsRes.data) {
      return { code: -1, message: '商品不存在' }
    }
    const goodsInfo = goodsRes.data

    // 获取卖家信息（可选，方便前端直接展示）
    const sellerRes = await users.doc(goodsInfo.seller_id).get()
    const seller = sellerRes.data || {}

    // 返回商品信息 + 卖家部分信息（如微信号、昵称等）
    return {
      code: 0,
      data: {
        ...goodsInfo,
        seller: {
          nickname: seller.nickname || '',
          avatar: seller.avatar || '',
          contact_wechat: seller.contact_wechat || '',
          contact_phone: seller.contact_phone || ''
        }
      }
    }
  } catch (err) {
    console.error('[getGoodsDetail] 错误:', err)
    return { code: -1, message: '获取商品详情失败' }
  }
}