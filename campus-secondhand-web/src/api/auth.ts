import request from './request'
import {
  ApiResponse,
  LoginParams,
  LoginResponse,
  RegisterParams
} from './types'

export const authApi = {
  sendCode(email: string) {
    return request.post<null>('/auth/send-code', { email })
  },
  
  verifyCode(email: string, code: string) {
    return request.post<null>('/auth/verify-code', { email, code })
  },
  
  register(data: RegisterParams) {
    return request.post<LoginResponse>('/auth/register', data)
  },
  
  login(data: LoginParams) {
    return request.post<LoginResponse>('/auth/login', data)
  },
  
  refreshToken(refreshToken: string) {
    return request.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
  },
  
  logout() {
    return request.post<null>('/auth/logout')
  }
}
