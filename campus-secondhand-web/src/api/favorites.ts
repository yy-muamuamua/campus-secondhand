import request from './request'
import {
  ApiResponse,
  Favorite,
  PageResponse,
  AddFavoriteParams,
  CheckFavoriteResponse,
  PageParams
} from './types'

export const favoritesApi = {
  addFavorite(data: AddFavoriteParams) {
    return request.post<{ _id: string }>('/favorites', data)
  },
  
  removeFavorite(favoriteId: string) {
    return request.delete<null>(`/favorites/${favoriteId}`)
  },
  
  checkFavorite(goodsId: string) {
    return request.get<CheckFavoriteResponse>(`/favorites/check/${goodsId}`)
  },
  
  getMyFavorites(params?: PageParams) {
    return request.get<PageResponse<Favorite>>('/favorites', { params })
  }
}
