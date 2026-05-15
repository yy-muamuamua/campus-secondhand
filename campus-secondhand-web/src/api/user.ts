import request from './request'
import {
  ApiResponse,
  User,
  UpdateUserParams,
  VerifyStudentParams,
  Goods,
  Message,
  PageResponse,
  PageParams
} from './types'

export const userApi = {
  getCurrentUser() {
    return request.get<User>('/users/me')
  },
  
  updateUser(data: UpdateUserParams) {
    return request.put<null>('/users/me', data)
  },
  
  getUserById(userId: string) {
    return request.get<User>(`/users/${userId}`)
  },
  
  verifyStudent(data: VerifyStudentParams) {
    return request.post<null>('/users/verify-student', data)
  },
  
  getMyGoods(params?: PageParams & { status?: string }) {
    return request.get<PageResponse<Goods>>('/users/me/goods', { params })
  },
  
  getMyMessages(params?: PageParams) {
    return request.get<PageResponse<Message>>('/users/me/messages', { params })
  }
}
