import request from './request'
import {
  ApiResponse,
  Message,
  PageResponse,
  AddMessageParams,
  ReplyMessageParams,
  PageParams
} from './types'

export const messagesApi = {
  getMessagesByGoods(goodsId: string, params?: PageParams) {
    return request.get<PageResponse<Message>>(`/goods/${goodsId}/messages`, { params })
  },
  
  addMessage(data: AddMessageParams) {
    return request.post<{ _id: string }>('/messages', data)
  },
  
  replyMessage(messageId: string, data: ReplyMessageParams) {
    return request.put<null>(`/messages/${messageId}/reply`, data)
  },
  
  deleteMessage(messageId: string) {
    return request.delete<null>(`/messages/${messageId}`)
  }
}
