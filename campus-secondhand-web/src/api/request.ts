import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { ApiResponse, ErrorCode } from './types'
import { useUserStore } from '@/stores/useUserStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    const token = userStore.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data
    
    if (code === ErrorCode.SUCCESS) {
      return data
    } else {
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message || '请求失败'))
    }
  },
  async (error: unknown) => {
    const axiosError = error as { 
      response?: { status?: number; data?: { message?: string } }; 
      message?: string; 
      config?: { 
        _retry?: boolean; 
        url?: string;
        headers?: { Authorization?: string }
      } 
    }
    const status = axiosError.response?.status
    const message = axiosError.response?.data?.message || axiosError.message || '网络错误'
    
    const originalRequest = axiosError.config
    
    if (status === 401 && originalRequest && !originalRequest._retry) {
      const userStore = useUserStore()
      
      if (userStore.refreshToken && !userStore.isRefreshing) {
        originalRequest._retry = true
        
        try {
          await userStore.refreshAccessToken()
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${userStore.accessToken}`
          }
          return request(originalRequest)
        } catch (refreshError) {
          userStore.logoutSilently()
          ElNotification.error('登录已过期，请重新登录')
          return Promise.reject(error)
        }
      } else {
        userStore.logoutSilently()
        ElNotification.error('登录已过期，请重新登录')
        return Promise.reject(error)
      }
    } else if (status === 401) {
      const userStore = useUserStore()
      userStore.logoutSilently()
      ElNotification.error('登录已过期，请重新登录')
    } else if (status === 403) {
      ElMessage.error('权限不足')
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status && status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (!axiosError.response) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error(message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export interface ApiResult<T> {
  code: number
  message?: string
  data: T
}

export default {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config) as Promise<T>
  },
  
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config) as Promise<T>
  },
  
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config) as Promise<T>
  },
  
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return request.patch(url, data, config) as Promise<T>
  },
  
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config) as Promise<T>
  }
}
