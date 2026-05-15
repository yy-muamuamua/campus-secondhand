import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from '@/api/types'
import { authApi, userApi } from '@/api'

const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'userInfo'

export const useUserStore = defineStore('user', () => {
  const accessToken = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const refreshToken = ref<string>(localStorage.getItem(REFRESH_TOKEN_KEY) || '')
  const userInfo = ref<User | null>(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  const isLoggedIn = computed(() => !!accessToken.value && !!userInfo.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const isRefreshing = ref(false)
  
  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    setToken(res.accessToken, res.refreshToken)
    try {
      await fetchUserInfo()
    } catch (error) {
      clearStorage()
      throw error
    }
    return res
  }
  
  async function register(email: string, password: string, code: string) {
    const res = await authApi.register({ email, password, code })
    setToken(res.accessToken, res.refreshToken)
    try {
      await fetchUserInfo()
    } catch (error) {
      clearStorage()
      throw error
    }
    return res
  }
  
  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      clearStorage()
    }
  }
  
  function logoutSilently() {
    clearStorage()
  }
  
  async function fetchUserInfo() {
    const user = await userApi.getCurrentUser()
    setUserInfo(user)
    return user
  }
  
  async function refreshAccessToken(): Promise<string | null> {
    if (isRefreshing.value) {
      return null
    }
    
    if (!refreshToken.value) {
      return null
    }
    
    isRefreshing.value = true
    
    try {
      const res = await authApi.refreshToken(refreshToken.value)
      setToken(res.accessToken, res.refreshToken)
      return res.accessToken
    } catch (error) {
      clearStorage()
      return null
    } finally {
      isRefreshing.value = false
    }
  }
  
  function setToken(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }
  
  function setUserInfo(user: User) {
    userInfo.value = user
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
  
  function clearStorage() {
    accessToken.value = ''
    refreshToken.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
  
  return {
    accessToken,
    refreshToken,
    userInfo,
    isLoggedIn,
    isAdmin,
    isRefreshing,
    login,
    register,
    logout,
    logoutSilently,
    fetchUserInfo,
    refreshAccessToken,
    setUserInfo,
    clearStorage
  }
})
