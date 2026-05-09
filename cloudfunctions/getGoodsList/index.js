const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const goods = db.collection('goods')
const _ = db.command

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  return userRes.data[0].isAdmin === true
}

exports.main = async (event, context) => {
  const {
    category,
    page = 1,
    pageSize = 10,
    keyword,
    sortBy = 'create_time',     // 排序字段：create_time, price, views
    sortOrder = 'desc',          // 排序方式：desc 降序，asc 升序
    minPrice,                    // 最低价（可选）
    maxPrice                     // 最高价（可选）
  } = event

  const skip = (page - 1) * pageSize
  let where = { status: 'on' }   // 只显示上架商品

  // 分类筛选
  if (category) {
    where.category = category
  }

  // 关键词搜索（标题包含）
  if (keyword) {
    where.title = db.RegExp({
      regexp: keyword,
      options: 'i'
    })
  }

  // 价格区间筛选
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) {
      where.price = _.gte(parseFloat(minPrice))
    }
    if (maxPrice !== undefined) {
      where.price = _.lte(parseFloat(maxPrice))
    }
    // 如果同时有 min 和 max，需要组合，上面分开写会覆盖，正确写法：
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = _.and(_.gte(parseFloat(minPrice)), _.lte(parseFloat(maxPrice)))
    } else if (minPrice !== undefined) {
      where.price = _.gte(parseFloat(minPrice))
    } else if (maxPrice !== undefined) {
      where.price = _.lte(parseFloat(maxPrice))
    }
  }

  try {
    // 查询总数
    const countRes = await goods.where(where).count()
    const total = countRes.total

    // 构建排序条件
    let orderBy = {}
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'

    // 查询商品列表
    const goodsRes = await goods.where(where)
      .orderBy(sortBy, orderBy[sortBy])
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: goodsRes.data,
        total,
        page,
        pageSize,
        hasMore: skip + goodsRes.data.length < total
      }
    }
  } catch (err) {
    console.error('[getGoodsList] 错误:', err)
    return { code: -1, message: '获取列表失败' }
  }
}