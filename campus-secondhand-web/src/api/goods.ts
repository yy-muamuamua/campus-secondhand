import request from './request'
import {
  ApiResponse,
  Goods,
  PageResponse,
  GoodsListParams,
  PublishGoodsParams,
  UpdateGoodsParams,
  UpdateGoodsStatusParams
} from './types'

export const goodsApi = {
  getGoodsList(params?: GoodsListParams) {
    return request.get<PageResponse<Goods>>('/goods', { params })
  },
  
  getGoodsDetail(goodsId: string) {
    return request.get<Goods>(`/goods/${goodsId}`)
  },
  
  publishGoods(data: PublishGoodsParams) {
    return request.post<{ _id: string }>('/goods', data)
  },
  
  updateGoods(goodsId: string, data: UpdateGoodsParams) {
    return request.put<null>(`/goods/${goodsId}`, data)
  },
  
  updateGoodsStatus(goodsId: string, data: UpdateGoodsStatusParams) {
    return request.patch<null>(`/goods/${goodsId}/status`, data)
  },
  
  deleteGoods(goodsId: string) {
    return request.delete<null>(`/goods/${goodsId}`)
  }
}
