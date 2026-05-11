# 校园二手交易平台 - 技术文档

## 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [前端开发](#前端开发)
- [后端开发](#后端开发)
- [数据库设计](#数据库设计)
- [云函数列表](#云函数列表)
- [页面功能说明](#页面功能说明)
- [开发指南](#开发指南)

---

## 项目概述

校园二手交易平台是一个基于微信小程序的二手物品交易系统，专为高校学生设计，提供便捷的二手物品发布、浏览、交易功能。

### 主要功能

- 用户注册/登录（邮箱密码登录）
- 商品发布与管理
- 商品浏览、搜索、筛选、排序
- 商品详情查看
- 收藏功能
- 留言与回复
- 用户个人中心
- 管理员后台

---

## 技术架构

### 整体架构

项目采用 **前后端分离** 架构，基于微信小程序云开发平台构建。

```
┌─────────────────────────────────────────┐
│         微信小程序前端                   │
│  (miniprogram - 原生框架)                │
└─────────────────┬───────────────────────┘
                  │ wx.cloud API
┌─────────────────▼───────────────────────┐
│         微信云开发平台                   │
│  ┌───────────────────────────────────┐ │
│  │  云函数 (Cloud Functions)         │ │
│  │  数据库 (Cloud Database)          │ │
│  │  文件存储 (Cloud Storage)         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 技术栈

#### 前端
- **框架**: 微信小程序原生框架
- **语言**: JavaScript
- **UI**: WXML + WXSS
- **云开发**: wx-server-sdk

#### 后端
- **运行环境**: 微信云函数 (Node.js)
- **数据库**: 微信云数据库 (JSON 文档型)
- **存储**: 微信云存储
- **SDK**: wx-server-sdk ~3.0.4

---

## 项目结构

```
campus-secondhand/
├── miniprogram/              # 小程序前端代码
│   ├── pages/                # 页面目录
│   │   ├── index/            # 首页（商品列表）
│   │   ├── detail/           # 商品详情页
│   │   ├── publish/          # 发布商品页
│   │   ├── myGoods/          # 我的发布页
│   │   ├── favorites/        # 我的收藏页
│   │   ├── myMessages/       # 我的消息页
│   │   ├── profile/          # 个人中心页
│   │   ├── login/            # 登录页
│   │   ├── register/         # 注册页
│   │   ├── verifyStudent/    # 学生验证页
│   │   ├── settings/         # 设置页
│   │   ├── editGoods/        # 编辑商品页
│   │   └── admin/            # 管理员后台
│   ├── components/           # 自定义组件
│   ├── images/               # 图片资源
│   ├── app.js                # 小程序入口
│   ├── app.json              # 小程序配置
│   ├── app.wxss              # 全局样式
│   └── envList.js            # 环境配置
├── cloudfunctions/           # 云函数目录
│   ├── login/                # 登录/注册
│   ├── getGoodsList/         # 获取商品列表
│   ├── getGoodsDetail/       # 获取商品详情
│   ├── publishGoods/         # 发布商品
│   ├── updateGoods/          # 更新商品
│   ├── deleteGoods/          # 删除商品
│   ├── getMyGoods/           # 获取我的商品
│   ├── addFavorite/          # 添加收藏
│   ├── removeFavorite/       # 取消收藏
│   ├── checkFavorite/        # 检查收藏状态
│   ├── getMyFavorites/       # 获取我的收藏
│   ├── getUserInfo/          # 获取用户信息
│   ├── updateUserInfo/       # 更新用户信息
│   ├── sendVerificationCode/ # 发送验证码
│   ├── verifyCode/           # 验证验证码
│   ├── addMessage/           # 添加留言
│   ├── replyMessage/         # 回复留言
│   ├── getMessagesByGoods/   # 获取商品留言
│   ├── getMyMessages/        # 获取我的消息
│   ├── getCurrentUserId/     # 获取当前用户ID
│   ├── adminGetStatistics/   # 管理员-获取统计数据
│   ├── adminGetGoodsList/    # 管理员-获取商品列表
│   ├── adminUpdateGoods/     # 管理员-更新商品
│   ├── adminDeleteGoods/     # 管理员-删除商品
│   ├── adminGetUserList/     # 管理员-获取用户列表
│   ├── adminUpdateUser/      # 管理员-更新用户
│   ├── adminGetMessageList/  # 管理员-获取留言列表
│   ├── adminDeleteMessage/   # 管理员-删除留言
│   └── quickstartFunctions/  # 示例云函数
├── project.config.json       # 项目配置文件
└── uploadCloudFunction.sh    # 云函数上传脚本
```

---

## 前端开发

### 小程序初始化

`miniprogram/app.js` 中初始化云开发：

```javascript
App({
  onLaunch: function () {
    this.globalData = {
      env: "cloud1-4grzuikdd211c6d6", // 云环境ID
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },
});
```

### 页面配置

`miniprogram/app.json` 配置小程序页面路由和 TabBar：

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/publish/publish",
    "pages/profile/profile",
    "pages/login/login",
    "pages/register/register",
    ...
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/myGoods/myGoods", "text": "我的发布" },
      { "pagePath": "pages/publish/publish", "text": "发布" },
      { "pagePath": "pages/favorites/favorites", "text": "收藏" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

### 云函数调用方式

前端通过 `wx.cloud.callFunction` 调用云函数：

```javascript
wx.cloud.callFunction({
  name: '云函数名称',
  data: { /* 传递给云函数的参数 */ }
}).then(res => {
  // 处理返回结果
}).catch(err => {
  // 处理错误
});
```

---

## 后端开发

### 云函数基本结构

每个云函数包含以下文件：

```
cloudfunctions/xxx/
├── index.js          # 云函数入口
├── package.json      # 依赖配置
└── config.json       # 云函数配置
```

### 云函数初始化模板

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID // 获取用户 openid
  
  // 业务逻辑...
  
  return {
    code: 0,
    message: 'success',
    data: {}
  }
}
```

### 数据库操作示例

```javascript
// 查询
const res = await db.collection('goods').where({ status: 'on' }).get()

// 添加
const addRes = await db.collection('goods').add({
  data: { title: 'xxx', price: 100 }
})

// 更新
await db.collection('goods').doc(goodsId).update({
  data: { status: 'sold' }
})

// 删除
await db.collection('goods').doc(goodsId).remove()
```

### 文件上传

```javascript
// 前端上传文件
wx.cloud.uploadFile({
  cloudPath: 'goods/xxx.jpg',
  filePath: '本地文件路径'
}).then(res => {
  console.log(res.fileID)
})
```

---

## 数据库设计

### 1. users 集合（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 用户ID（自动生成） |
| openid | String | 微信 openid |
| email | String | 邮箱 |
| password | String | 密码（注意：生产环境应加密） |
| nickname | String | 昵称 |
| avatar | String | 头像URL |
| student_id | String | 学号 |
| role | String | 角色：guest/student/admin |
| isAdmin | Boolean | 是否管理员 |
| email_verified | Boolean | 邮箱是否验证 |
| contact_wechat | String | 微信号 |
| contact_phone | String | 手机号 |
| create_time | Date | 创建时间 |
| last_login | Date | 最后登录时间 |
| disabled | Boolean | 是否禁用 |

### 2. goods 集合（商品表）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 商品ID（自动生成） |
| title | String | 标题 |
| description | String | 描述 |
| price | Number | 价格 |
| category | String | 分类：书籍/电子产品/生活用品/其他 |
| images | Array | 图片URL数组 |
| seller_id | String | 卖家用户ID |
| status | String | 状态：on（上架）/off（下架）/sold（已售） |
| views | Number | 浏览次数 |
| create_time | Date | 创建时间 |
| update_time | Date | 更新时间 |

### 3. favorites 集合（收藏表）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 收藏ID（自动生成） |
| user_id | String | 用户ID |
| goods_id | String | 商品ID |
| create_time | Date | 收藏时间 |

### 4. messages 集合（留言表）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 留言ID（自动生成） |
| goods_id | String | 商品ID |
| user_id | String | 留言用户ID |
| content | String | 留言内容 |
| reply | String | 回复内容 |
| create_time | Date | 创建时间 |
| reply_time | Date | 回复时间 |

---

## 云函数列表

### 用户认证

| 云函数 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| login | 登录/注册 | action, email, password | success, userId, role |
| sendVerificationCode | 发送验证码 | email | - |
| verifyCode | 验证验证码 | email, code | - |

### 商品相关

| 云函数 | 功能 | 参数 |
|--------|------|------|
| getGoodsList | 获取商品列表 | page, pageSize, category, keyword, sortBy, sortOrder, minPrice, maxPrice |
| getGoodsDetail | 获取商品详情 | goodsId |
| publishGoods | 发布商品 | title, description, price, category, images |
| updateGoods | 更新商品 | goodsId, ... |
| deleteGoods | 删除商品 | goodsId |
| getMyGoods | 获取我的商品 | - |

### 收藏相关

| 云函数 | 功能 | 参数 |
|--------|------|------|
| addFavorite | 添加收藏 | goodsId |
| removeFavorite | 取消收藏 | goodsId |
| checkFavorite | 检查收藏状态 | goodsId |
| getMyFavorites | 获取我的收藏 | - |

### 用户相关

| 云函数 | 功能 | 参数 |
|--------|------|------|
| getUserInfo | 获取用户信息 | - |
| updateUserInfo | 更新用户信息 | contact_wechat, contact_phone |
| getCurrentUserId | 获取当前用户ID | - |

### 留言相关

| 云函数 | 功能 | 参数 |
|--------|------|------|
| addMessage | 添加留言 | goodsId, content |
| replyMessage | 回复留言 | messageId, reply |
| getMessagesByGoods | 获取商品留言 | goodsId |
| getMyMessages | 获取我的消息 | - |

### 管理员功能

| 云函数 | 功能 |
|--------|------|
| adminGetStatistics | 获取统计数据 |
| adminGetGoodsList | 获取商品列表（可筛选状态） |
| adminUpdateGoods | 更新商品状态 |
| adminDeleteGoods | 删除商品 |
| adminGetUserList | 获取用户列表 |
| adminUpdateUser | 启用/禁用用户 |
| adminGetMessageList | 获取留言列表 |
| adminDeleteMessage | 删除留言 |

---

## 页面功能说明

### 1. 首页 (pages/index/)

**功能**:
- 商品列表展示（分页加载）
- 分类筛选（全部/书籍/电子产品/生活用品/其他）
- 关键词搜索
- 排序（最新发布/价格最低/价格最高/最热商品）
- 价格区间筛选
- 下拉刷新
- 上拉加载更多
- 点击跳转商品详情

**核心数据**:
```javascript
{
  goodsList: [],
  currentCategory: '全部',
  keyword: '',
  sortBy: 'create_time',
  sortOrder: 'desc',
  minPrice: '',
  maxPrice: ''
}
```

### 2. 商品详情页 (pages/detail/)

**功能**:
- 商品信息展示（标题、价格、描述、图片、卖家信息）
- 图片预览
- 浏览次数统计
- 收藏/取消收藏
- 联系卖家（复制微信号）
- 留言功能
- 回复留言
- 卖家可标记商品为已售

**核心数据**:
```javascript
{
  goodsInfo: null,
  sellerInfo: null,
  isFavorited: false,
  isSeller: false,
  messages: []
}
```

### 3. 发布商品页 (pages/publish/)

**功能**:
- 填写商品信息（标题、描述、价格、分类）
- 选择/上传图片（最多9张）
- 图片预览
- 删除图片
- 提交发布

**核心数据**:
```javascript
{
  title: '',
  description: '',
  price: '',
  category: '书籍',
  images: [], // 本地临时路径
  imageFileIDs: [] // 云存储fileID
}
```

### 4. 个人中心 (pages/profile/)

**功能**:
- 用户信息展示
- 跳转我的发布
- 跳转我的收藏
- 跳转我的消息
- 跳转设置
- 管理员入口

### 5. 登录页 (pages/login/)

**功能**:
- 邮箱密码登录
- 跳转到注册页

### 6. 注册页 (pages/register/)

**功能**:
- 邮箱注册
- 验证码验证
- 设置密码

### 7. 管理员后台 (pages/admin/)

**功能**:
- 统计数据展示
- 商品管理（列表、修改状态、删除）
- 用户管理（列表、禁用/启用）
- 留言管理（列表、删除）

---

## 开发指南

### 环境准备

1. 安装微信开发者工具
2. 注册微信小程序账号
3. 开通微信云开发服务
4. 创建云环境

### 本地开发

1. 克隆项目到本地
2. 用微信开发者工具打开项目
3. 在 `project.config.json` 中配置自己的 appid
4. 在 `miniprogram/app.js` 中配置云环境ID
5. 上传并部署所有云函数
6. 创建数据库集合（users, goods, favorites, messages）
7. 设置数据库权限

### 云函数部署

#### 方式一：微信开发者工具

1. 右键云函数文件夹
2. 选择"上传并部署：云端安装依赖"

#### 方式二：命令行

```bash
# 使用提供的脚本
./uploadCloudFunction.sh
```

### 数据库权限配置

- users 集合：仅创建者可读写
- goods 集合：所有用户可读，仅创建者可写
- favorites 集合：仅创建者可读写
- messages 集合：所有用户可读，仅创建者可写

### 注意事项

1. **密码安全**: 当前密码为明文存储，生产环境应使用 bcrypt 等加密
2. **图片限制**: 单张图片大小不超过 10MB
3. **云函数超时**: 默认超时时间 20 秒
4. **数据库查询**: 单次查询最多返回 100 条记录，需分页
5. **openid 获取**: 云函数中通过 `cloud.getWXContext().OPENID` 获取

---

## 常见问题

### 1. 云函数调用失败

检查：
- 云函数是否已部署
- 云环境ID是否正确
- 云函数是否有日志输出

### 2. 数据库权限错误

检查：
- 数据库集合权限设置
- 用户是否已登录

### 3. 图片上传失败

检查：
- 云存储空间是否足够
- 图片大小是否超限
- 网络连接是否正常

---

## 更新日志

### v1.0.0 (2024-XX-XX)

- 初始版本发布
- 实现基础的商品发布、浏览功能
- 实现用户登录注册
- 实现收藏和留言功能
- 实现管理员后台
