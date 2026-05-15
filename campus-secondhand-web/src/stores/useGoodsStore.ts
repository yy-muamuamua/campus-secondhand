import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Goods, GoodsListParams } from '@/api/types'
import { goodsApi } from '@/api'

export const useGoodsStore = defineStore('goods', () => {
  const goodsList = ref<Goods[]>([])
  const currentGoods = ref<Goods | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  async function fetchGoodsList(params?: GoodsListParams) {
    loading.value = true
    try {
      const res = await goodsApi.getGoodsList({
        page: params?.page || currentPage.value,
        pageSize: params?.pageSize || pageSize.value,
        ...params
      })
      goodsList.value = res.list
      total.value = res.total
      if (params?.page) {
        currentPage.value = params.page
      }
      return res
    } catch (error) {
      goodsList.value = []
      throw error
    } finally {
      loading.value = false
    }
  }
  
  async function fetchGoodsDetail(goodsId: string) {
    loading.value = true
    try {
      const goods = await goodsApi.getGoodsDetail(goodsId)
      currentGoods.value = goods
      return goods
    } catch (error) {
      currentGoods.value = null
      throw error
    } finally {
      loading.value = false
    }
  }
  
  function resetList() {
    currentPage.value = 1
    goodsList.value = []
    total.value = 0
  }
  
  function setCurrentPage(page: number) {
    currentPage.value = page
  }
  
  return {
    goodsList,
    currentGoods,
    loading,
    total,
    currentPage,
    pageSize,
    fetchGoodsList,
    fetchGoodsDetail,
    resetList,
    setCurrentPage
  }
})
