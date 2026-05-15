import request from './request'
import {
  ApiResponse,
  AdminStatistics,
  PageResponse,
  Goods,
  User,
  Message,
  AdminGoodsListParams,
  AdminUserListParams,
  AdminMessageListParams,
  UpdateGoodsStatusParams,
  AdminUpdateUserStatusParams
} from './types'

export const adminApi = {
  getStatistics() {
    return request.get<AdminStatistics>('/admin/statistics')
  },
  
  getAdminGoodsList(params?: AdminGoodsListParams) {
    return request.get<PageResponse<Goods>>('/admin/goods', { params })
  },
  
  adminUpdateGoodsStatus(goodsId: string, data: UpdateGoodsStatusParams) {
    return request.put<null>(`/admin/goods/${goodsId}/status`, data)
  },
  
  adminDeleteGoods(goodsId: string) {
    return request.delete<null>(`/admin/goods/${goodsId}`)
  },
  
  getAdminUserList(params?: AdminUserListParams) {
    return request.get<PageResponse<User>>('/admin/users', { params })
  },
  
  adminUpdateUserStatus(userId: string, data: AdminUpdateUserStatusParams) {
    return request.put<null>(`/admin/users/${userId}/status`, data)
  },
  
  getAdminMessageList(params?: AdminMessageListParams) {
    return request.get<PageResponse<Message>>('/admin/messages', { params })
  },
  
  adminDeleteMessage(messageId: string) {
    return request.delete<null>(`/admin/messages/${messageId}`)
  }
}
