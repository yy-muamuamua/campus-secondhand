# 校园二手交易平台 - 前端重构项目

## 项目概述

这是一个从零开始重构的校园二手交易平台前端系统，采用现代化的技术栈和架构设计，完全与后端 API 接口匹配与集成。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **类型系统**: TypeScript 5
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **样式**: SCSS

## 项目结构

```
campus-secondhand-web/
├── src/
│   ├── api/                    # API 相关
│   │   ├── auth.ts            # 认证接口
│   │   ├── user.ts            # 用户接口
│   │   ├── goods.ts           # 商品接口
│   │   ├── favorites.ts       # 收藏接口
│   │   ├── messages.ts        # 留言接口
│   │   ├── admin.ts           # 管理后台接口
│   │   ├── request.ts         # Axios 封装
│   │   ├── types.ts           # TypeScript 类型定义
│   │   └── index.ts           # API 导出
│   ├── assets/
│   │   └── styles/
│   │       ├── variables.scss  # 变量定义
│   │       └── global.scss     # 全局样式
│   ├── router/
│   │   └── index.ts           # 路由配置
│   ├── stores/
│   │   ├── useUserStore.ts    # 用户状态管理
│   │   └── useGoodsStore.ts   # 商品状态管理
│   ├── views/
│   │   ├── Home/
│   │   │   └── index.vue      # 首页
│   │   ├── Auth/
│   │   │   ├── Login.vue      # 登录页
│   │   │   └── Register.vue   # 注册页
│   │   ├── Goods/
│   │   │   ├── Detail.vue     # 商品详情页
│   │   │   ├── Publish.vue    # 发布商品页
│   │   │   └── Edit.vue       # 编辑商品页
│   │   ├── Profile/
│   │   │   └── index.vue      # 个人中心
│   │   ├── Favorites/
│   │   │   └── index.vue      # 我的收藏
│   │   ├── MyGoods/
│   │   │   └── index.vue      # 我的商品
│   │   ├── MyMessages/
│   │   │   └── index.vue      # 我的留言
│   │   ├── Admin/
│   │   │   ├── Dashboard.vue  # 管理后台 - 数据统计
│   │   │   ├── Goods.vue      # 管理后台 - 商品管理
│   │   │   ├── Users.vue      # 管理后台 - 用户管理
│   │   │   └── Messages.vue   # 管理后台 - 留言管理
│   │   └── Error/
│   │       └── 404.vue        # 404 页面
│   ├── App.vue                # 根组件
│   └── main.ts                # 入口文件
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 功能模块

### 1. 认证模块
- 用户登录
- 用户注册（带邮箱验证码）
- 退出登录
- Token 刷新机制
- 权限控制（路由守卫）

### 2. 商品模块
- 商品列表（搜索、分类、排序）
- 商品详情
- 发布商品
- 编辑商品
- 商品上下架
- 标记商品已售

### 3. 用户模块
- 个人中心
- 用户信息编辑
- 学生认证
- 我的商品
- 我的收藏
- 我的留言

### 4. 收藏模块
- 添加收藏
- 取消收藏
- 收藏列表
- 检查是否已收藏

### 5. 留言模块
- 查看商品留言
- 发表留言
- 回复留言
- 删除留言

### 6. 管理后台
- 数据统计（用户数、商品数、留言数等）
- 商品管理
- 用户管理
- 留言管理

## UI 设计

- **设计风格**: 极简主义
- **配色方案**: 莫兰迪色系（饱和度 30%-50%）
- **响应式设计**: 支持桌面端、平板和移动设备
- **无障碍标准**: 符合 WCAG 2.1 AA 级标准

## 安装与运行

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## API 集成

项目与后端 API 完全匹配，涵盖以下接口：

- 认证接口（登录、注册、验证码等）
- 用户接口（获取用户信息、更新用户、学生认证等）
- 商品接口（商品列表、详情、发布、编辑等）
- 收藏接口（收藏列表、添加/取消收藏等）
- 留言接口（留言列表、发表、回复、删除等）
- 管理接口（统计数据、商品/用户/留言管理等）

所有接口都包含完整的 TypeScript 类型定义和错误处理。

## 状态管理

使用 Pinia 进行状态管理：

- `useUserStore`: 管理用户认证状态、用户信息
- `useGoodsStore`: 管理商品列表、商品详情等状态

## 表单验证

所有表单都包含完整的验证逻辑：

- 必填字段验证
- 邮箱格式验证
- 密码强度验证
- 两次密码一致性验证
- 字段长度限制

## 错误处理

- 统一的 HTTP 请求错误拦截
- 友好的错误提示信息
- Token 失效自动跳转登录
- 网络错误处理

## 响应式设计

- 移动端适配（< 640px）
- 平板适配（640px - 1024px）
- 桌面端适配（> 1024px）

## 性能优化

- 路由懒加载
- 组件按需加载
- 图片懒加载
- API 请求防抖
- 状态持久化（localStorage）

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发说明

### 环境变量

在项目根目录创建 `.env` 文件配置环境变量：

```env
VITE_API_BASE_URL=http://your-api-domain.com/api
```

### 代码规范

- 使用 TypeScript 严格模式
- 组件使用 Composition API
- 遵循 ESLint 规范
- 统一的代码格式化

## 项目完成度

✅ 分析并理解后端 API 接口文档  
✅ 设计并搭建前端项目架构  
✅ 实现所有功能模块对应的页面和组件  
✅ 建立完整的数据请求层  
✅ 实现响应式布局  
✅ 添加表单验证和错误处理  
✅ 准备性能优化和兼容性测试  
