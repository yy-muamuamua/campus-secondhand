// API相关类型定义

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface PageParams {
  page?: number
  pageSize?: number
}

// 用户相关类型
export type UserRole = 'guest' | 'student' | 'admin'

export interface User {
  _id: string
  openid?: string
  email: string
  nickname: string
  avatar: string
  studentId?: string
  role: UserRole
  isAdmin?: boolean
  emailVerified: boolean
  contactWechat?: string
  contactPhone?: string
  createTime: string
  lastLogin: string
  disabled?: boolean
}

export interface LoginParams {
  email: string
  password: string
}

export interface LoginResponse {
  userId: string
  accessToken: string
  refreshToken: string
  role: UserRole
}

export interface RegisterParams {
  email: string
  password: string
  code: string
}

export interface UpdateUserParams {
  nickname?: string
  avatar?: string
  contact_wechat?: string
  contact_phone?: string
}

export interface VerifyStudentParams {
  student_id: string
  student_name: string
}

// 商品相关类型
export type GoodsStatus = 'on' | 'off' | 'sold'
export type GoodsCategory = '书籍' | '电子产品' | '生活用品' | '其他'

export interface Goods {
  _id: string
  title: string
  description: string
  price: number
  category: GoodsCategory
  images: string[]
  seller_id: string
  seller?: {
    _id: string
    nickname: string
    avatar: string
    contact_wechat?: string
    contact_phone?: string
  }
  status: GoodsStatus
  views: number
  create_time: string
  update_time: string
}

export interface GoodsListParams extends PageParams {
  category?: GoodsCategory
  keyword?: string
  sortBy?: 'create_time' | 'price' | 'views'
  sortOrder?: 'asc' | 'desc'
  minPrice?: number
  maxPrice?: number
  status?: GoodsStatus
}

export interface PublishGoodsParams {
  title: string
  description: string
  price: number
  category: GoodsCategory
  images: string[]
}

export interface UpdateGoodsParams {
  title?: string
  description?: string
  price?: number
  category?: GoodsCategory
  images?: string[]
}

export interface UpdateGoodsStatusParams {
  status: GoodsStatus
}

// 收藏相关类型
export interface Favorite {
  _id: string
  goods_id: string
  goods?: Partial<Goods>
  create_time: string
}

export interface AddFavoriteParams {
  goodsId: string
}

export interface CheckFavoriteResponse {
  isFavorited: boolean
  favoriteId?: string
}

// 留言相关类型
export interface Message {
  _id: string
  goods_id: string
  user_id: string
  user?: {
    _id: string
    nickname: string
    avatar: string
  }
  goods?: {
    _id: string
    title: string
  }
  content: string
  reply?: string
  create_time: string
  reply_time?: string
}

export interface AddMessageParams {
  goodsId: string
  content: string
}

export interface ReplyMessageParams {
  reply: string
}

// 管理员相关类型
export interface AdminStatistics {
  totalUsers: number
  totalGoods: number
  totalMessages: number
  todayNewUsers: number
  todayNewGoods: number
  todayNewMessages: number
}

export interface AdminGoodsListParams extends PageParams {
  status?: GoodsStatus
  keyword?: string
}

export interface AdminUserListParams extends PageParams {
  keyword?: string
}

export interface AdminMessageListParams extends PageParams {
  keyword?: string
}

export interface AdminUpdateUserStatusParams {
  disabled: boolean
}

// 错误码类型
export enum ErrorCode {
  SUCCESS = 0,
  UNKNOWN_ERROR = -1,
  PARAM_ERROR = 1001,
  MISSING_PARAM = 1002,
  USER_NOT_FOUND = 2001,
  PASSWORD_ERROR = 2002,
  EMAIL_EXISTS = 2003,
  CODE_ERROR = 2004,
  CODE_EXPIRED = 2005,
  NOT_LOGGED_IN = 2006,
  TOKEN_INVALID = 2007,
  TOKEN_EXPIRED = 2008,
  PERMISSION_DENIED = 2009,
  GOODS_NOT_FOUND = 3001,
  GOODS_DELETED = 3002,
  GOODS_NO_PERMISSION = 3003,
  FAVORITE_NOT_FOUND = 4001,
  FAVORITE_EXISTS = 4002,
  MESSAGE_NOT_FOUND = 5001,
  MESSAGE_NO_PERMISSION = 5002,
  UPLOAD_FAILED = 6001,
  FILE_TOO_LARGE = 6002,
  FILE_TYPE_NOT_SUPPORTED = 6003
}