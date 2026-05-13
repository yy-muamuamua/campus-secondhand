# 校园二手交易平台 - RESTful API 文档

**API版本**: v1.0  
**基础URL**: `https://api.campus-secondhand.com/api/v1`  
**数据格式**: JSON  

---

## 目录

- [通用规范](#通用规范)
- [认证相关](#认证相关)
- [用户相关](#用户相关)
- [商品相关](#商品相关)
- [收藏相关](#收藏相关)
- [留言相关](#留言相关)
- [管理员相关](#管理员相关)
- [错误码说明](#错误码说明)

---

## 通用规范

### 请求头

```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

### 通用参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10，最大100 |

### 通用响应格式

**成功响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**错误响应**:
```json
{
  "code": -1,
  "message": "错误信息",
  "data": null
}
```

### 分页响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

## 认证相关

### 1. 发送验证码

**接口**: `POST /auth/send-code`

**请求参数**:
```json
{
  "email": "user@example.com"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "验证码已发送",
  "data": null
}
```

---

### 2. 验证验证码

**接口**: `POST /auth/verify-code`

**请求参数**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "验证成功",
  "data": null
}
```

---

### 3. 用户注册

**接口**: `POST /auth/register`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "code": "123456"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "userId": "user_123456",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. 用户登录

**接口**: `POST /auth/login`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "userId": "user_123456",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "student"
  }
}
```

---

### 5. 刷新Token

**接口**: `POST /auth/refresh`

**请求参数**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**:
```json
{
  "code": 0,
  "message": "刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 6. 退出登录

**接口**: `POST /auth/logout`

**请求头**: 需要携带 `Authorization`

**响应**:
```json
{
  "code": 0,
  "message": "退出成功",
  "data": null
}
```

---

## 用户相关

### 1. 获取当前用户信息

**接口**: `GET /users/me`

**请求头**: 需要携带 `Authorization`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "user_123456",
    "email": "user@example.com",
    "nickname": "张三",
    "avatar": "https://xxx.com/avatar.jpg",
    "student_id": "20240001",
    "role": "student",
    "email_verified": true,
    "contact_wechat": "wechat123",
    "contact_phone": "13800138000",
    "create_time": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. 更新用户信息

**接口**: `PUT /users/me`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "nickname": "李四",
  "avatar": "https://xxx.com/new-avatar.jpg",
  "contact_wechat": "newwechat",
  "contact_phone": "13900139000"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "更新成功",
  "data": null
}
```

---

### 3. 获取指定用户信息

**接口**: `GET /users/:userId`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "user_123456",
    "nickname": "张三",
    "avatar": "https://xxx.com/avatar.jpg",
    "student_id": "20240001",
    "role": "student"
  }
}
```

---

### 4. 学生验证

**接口**: `POST /users/verify-student`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "student_id": "20240001",
  "student_name": "张三"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "验证成功",
  "data": null
}
```

---

## 商品相关

### 1. 获取商品列表

**接口**: `GET /goods`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |
| category | String | 否 | 分类：书籍/电子产品/生活用品/其他 |
| keyword | String | 否 | 搜索关键词 |
| sortBy | String | 否 | 排序字段：create_time/price/views，默认create_time |
| sortOrder | String | 否 | 排序方式：asc/desc，默认desc |
| minPrice | Number | 否 | 最低价 |
| maxPrice | Number | 否 | 最高价 |
| status | String | 否 | 状态：on/off/sold，默认on |

**示例请求**:
```
GET /goods?page=1&pageSize=10&category=书籍&sortBy=price&sortOrder=asc
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "_id": "goods_123456",
        "title": "高等数学教材",
        "description": "九成新，无笔记",
        "price": 50.00,
        "category": "书籍",
        "images": [
          "https://xxx.com/image1.jpg",
          "https://xxx.com/image2.jpg"
        ],
        "seller_id": "user_123456",
        "seller": {
          "nickname": "张三",
          "avatar": "https://xxx.com/avatar.jpg"
        },
        "status": "on",
        "views": 100,
        "create_time": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

### 2. 获取商品详情

**接口**: `GET /goods/:goodsId`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "goods_123456",
    "title": "高等数学教材",
    "description": "九成新，无笔记",
    "price": 50.00,
    "category": "书籍",
    "images": [
      "https://xxx.com/image1.jpg",
      "https://xxx.com/image2.jpg"
    ],
    "seller_id": "user_123456",
    "seller": {
      "_id": "user_123456",
      "nickname": "张三",
      "avatar": "https://xxx.com/avatar.jpg",
      "contact_wechat": "wechat123",
      "contact_phone": "13800138000"
    },
    "status": "on",
    "views": 101,
    "create_time": "2024-01-15T10:00:00Z",
    "update_time": "2024-01-15T10:00:00Z"
  }
}
```

---

### 3. 发布商品

**接口**: `POST /goods`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "title": "高等数学教材",
  "description": "九成新，无笔记",
  "price": 50.00,
  "category": "书籍",
  "images": [
    "https://xxx.com/image1.jpg",
    "https://xxx.com/image2.jpg"
  ]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "发布成功",
  "data": {
    "_id": "goods_123456"
  }
}
```

---

### 4. 更新商品

**接口**: `PUT /goods/:goodsId`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "title": "高等数学教材（新版）",
  "description": "九成新，无笔记，附赠习题册",
  "price": 55.00,
  "category": "书籍",
  "images": [
    "https://xxx.com/image1.jpg",
    "https://xxx.com/image2.jpg",
    "https://xxx.com/image3.jpg"
  ]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "更新成功",
  "data": null
}
```

---

### 5. 更新商品状态

**接口**: `PATCH /goods/:goodsId/status`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "status": "sold"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "更新成功",
  "data": null
}
```

---

### 6. 删除商品

**接口**: `DELETE /goods/:goodsId`

**请求头**: 需要携带 `Authorization`

**响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

### 7. 获取我的商品

**接口**: `GET /users/me/goods`

**请求头**: 需要携带 `Authorization`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |
| status | String | 否 | 状态：on/off/sold |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

---

## 收藏相关

### 1. 添加收藏

**接口**: `POST /favorites`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "goodsId": "goods_123456"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "收藏成功",
  "data": {
    "_id": "fav_123456"
  }
}
```

---

### 2. 取消收藏

**接口**: `DELETE /favorites/:favoriteId`

**请求头**: 需要携带 `Authorization`

**响应**:
```json
{
  "code": 0,
  "message": "取消成功",
  "data": null
}
```

---

### 3. 检查收藏状态

**接口**: `GET /favorites/check/:goodsId`

**请求头**: 需要携带 `Authorization`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "isFavorited": true,
    "favoriteId": "fav_123456"
  }
}
```

---

### 4. 获取我的收藏

**接口**: `GET /favorites`

**请求头**: 需要携带 `Authorization`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "_id": "fav_123456",
        "goods": {
          "_id": "goods_123456",
          "title": "高等数学教材",
          "price": 50.00,
          "images": ["https://xxx.com/image1.jpg"],
          "status": "on"
        },
        "create_time": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

## 留言相关

### 1. 获取商品留言

**接口**: `GET /goods/:goodsId/messages`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "_id": "msg_123456",
        "goods_id": "goods_123456",
        "user": {
          "_id": "user_789",
          "nickname": "李四",
          "avatar": "https://xxx.com/avatar2.jpg"
        },
        "content": "还在吗？可以便宜点吗？",
        "reply": "可以再便宜5元",
        "create_time": "2024-01-15T11:00:00Z",
        "reply_time": "2024-01-15T11:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

---

### 2. 发布留言

**接口**: `POST /messages`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "goodsId": "goods_123456",
  "content": "还在吗？可以便宜点吗？"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "留言成功",
  "data": {
    "_id": "msg_123456"
  }
}
```

---

### 3. 回复留言

**接口**: `PUT /messages/:messageId/reply`

**请求头**: 需要携带 `Authorization`

**请求参数**:
```json
{
  "reply": "可以再便宜5元"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "回复成功",
  "data": null
}
```

---

### 4. 获取我的留言

**接口**: `GET /users/me/messages`

**请求头**: 需要携带 `Authorization`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 15,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

### 5. 删除留言

**接口**: `DELETE /messages/:messageId`

**请求头**: 需要携带 `Authorization`

**响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

## 管理员相关

> 所有管理员接口都需要管理员权限

### 1. 获取统计数据

**接口**: `GET /admin/statistics`

**请求头**: 需要携带 `Authorization`（管理员）

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalUsers": 1000,
    "totalGoods": 500,
    "totalMessages": 2000,
    "todayNewUsers": 10,
    "todayNewGoods": 5,
    "todayNewMessages": 20
  }
}
```

---

### 2. 获取所有商品

**接口**: `GET /admin/goods`

**请求头**: 需要携带 `Authorization`（管理员）

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |
| status | String | 否 | 状态：on/off/sold |
| keyword | String | 否 | 搜索关键词 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 500,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

### 3. 更新商品状态

**接口**: `PUT /admin/goods/:goodsId/status`

**请求头**: 需要携带 `Authorization`（管理员）

**请求参数**:
```json
{
  "status": "off"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "更新成功",
  "data": null
}
```

---

### 4. 删除商品

**接口**: `DELETE /admin/goods/:goodsId`

**请求头**: 需要携带 `Authorization`（管理员）

**响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

### 5. 获取所有用户

**接口**: `GET /admin/users`

**请求头**: 需要携带 `Authorization`（管理员）

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |
| keyword | String | 否 | 搜索关键词 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "_id": "user_123456",
        "email": "user@example.com",
        "nickname": "张三",
        "role": "student",
        "disabled": false,
        "create_time": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

### 6. 启用/禁用用户

**接口**: `PUT /admin/users/:userId/status`

**请求头**: 需要携带 `Authorization`（管理员）

**请求参数**:
```json
{
  "disabled": true
}
```

**响应**:
```json
{
  "code": 0,
  "message": "操作成功",
  "data": null
}
```

---

### 7. 获取所有留言

**接口**: `GET /admin/messages`

**请求头**: 需要携带 `Authorization`（管理员）

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |
| keyword | String | 否 | 搜索关键词 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 2000,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

---

### 8. 删除留言

**接口**: `DELETE /admin/messages/:messageId`

**请求头**: 需要携带 `Authorization`（管理员）

**响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| -1 | 未知错误 |
| 1001 | 参数错误 |
| 1002 | 缺少必要参数 |
| 2001 | 用户不存在 |
| 2002 | 密码错误 |
| 2003 | 邮箱已被注册 |
| 2004 | 验证码错误 |
| 2005 | 验证码已过期 |
| 2006 | 未登录 |
| 2007 | Token无效 |
| 2008 | Token已过期 |
| 2009 | 权限不足 |
| 3001 | 商品不存在 |
| 3002 | 商品已删除 |
| 3003 | 无权操作此商品 |
| 4001 | 收藏不存在 |
| 4002 | 已收藏 |
| 5001 | 留言不存在 |
| 5002 | 无权操作此留言 |
| 6001 | 文件上传失败 |
| 6002 | 文件大小超限 |
| 6003 | 文件格式不支持 |

---

## 附录

### 数据模型

#### 用户模型 (User)
```typescript
interface User {
  _id: string;
  openid?: string;
  email: string;
  password?: string;
  nickname: string;
  avatar: string;
  student_id?: string;
  role: 'guest' | 'student' | 'admin';
  isAdmin?: boolean;
  email_verified: boolean;
  contact_wechat?: string;
  contact_phone?: string;
  create_time: Date;
  last_login: Date;
  disabled?: boolean;
}
```

#### 商品模型 (Goods)
```typescript
interface Goods {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: '书籍' | '电子产品' | '生活用品' | '其他';
  images: string[];
  seller_id: string;
  seller?: {
    _id: string;
    nickname: string;
    avatar: string;
    contact_wechat?: string;
    contact_phone?: string;
  };
  status: 'on' | 'off' | 'sold';
  views: number;
  create_time: Date;
  update_time: Date;
}
```

#### 收藏模型 (Favorite)
```typescript
interface Favorite {
  _id: string;
  user_id: string;
  goods_id: string;
  create_time: Date;
}
```

#### 留言模型 (Message)
```typescript
interface Message {
  _id: string;
  goods_id: string;
  user_id: string;
  user?: {
    _id: string;
    nickname: string;
    avatar: string;
  };
  content: string;
  reply?: string;
  create_time: Date;
  reply_time?: Date;
}
```

---

**文档版本**: v1.0  
**最后更新**: 2026-05-12
