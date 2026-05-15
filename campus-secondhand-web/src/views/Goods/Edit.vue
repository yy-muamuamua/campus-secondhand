<template>
  <div class="edit-goods-container">
    <div class="edit-goods-header">
      <el-button icon="ArrowLeft" @click="$router.back()" circle />
      <span>编辑商品</span>
    </div>

    <div class="edit-goods-content">
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-position="top"
        class="edit-form"
        v-loading="loading"
      >
        <el-form-item label="商品标题" prop="title">
          <el-input
            v-model="editForm.title"
            placeholder="请输入商品标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="商品分类" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="书籍" value="书籍" />
            <el-option label="电子产品" value="电子产品" />
            <el-option label="生活用品" value="生活用品" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="商品价格" prop="price">
          <el-input-number
            v-model="editForm.price"
            :min="0"
            :precision="2"
            :step="1"
            placeholder="请输入价格"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="6"
            placeholder="请输入商品描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="商品图片">
          <el-upload
            v-model:file-list="fileList"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :http-request="handleUpload"
            :limit="9"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogVisible" title="预览" width="50%">
            <img :src="dialogImageUrl" style="width: 100%; display: block" alt="Preview" />
          </el-dialog>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit" :loading="submitting">
            保存修改
          </el-button>
          <el-button @click="$router.back()">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { goodsApi } from '@/api'
import request from '@/api/request'
import type { FormInstance, FormRules, UploadUserFile, UploadProps, UploadRequestHandler } from 'element-plus'

const router = useRouter()
const route = useRoute()
const editFormRef = ref<FormInstance>()
const fileList = ref<UploadUserFile[]>([])
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const originalImages = ref<string[]>([])

const editForm = reactive({
  title: '',
  category: '',
  price: 0,
  description: '',
  images: [] as string[]
})

const editRules: FormRules = {
  title: [
    { required: true, message: '请输入商品标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度为 2-50 位', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入商品描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度为 10-500 位', trigger: 'blur' }
  ]
}

async function loadGoodsDetail() {
  const goodsId = route.params.id as string
  loading.value = true
  try {
    const goods = await goodsApi.getGoodsDetail(goodsId)
    editForm.title = goods.title
    editForm.category = goods.category
    editForm.price = goods.price
    editForm.description = goods.description
    editForm.images = [...goods.images]
    originalImages.value = [...goods.images]
    
    // 初始化文件列表
    fileList.value = goods.images.map((url: string, index: number) => ({
      uid: String(index),
      name: `image${index}.jpg`,
      status: 'success',
      url: url
    }))
  } finally {
    loading.value = false
  }
}

const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}

const handleRemove: UploadProps['onRemove'] = (uploadFile) => {
  const index = editForm.images.findIndex(url => url === uploadFile.url)
  if (index !== -1) {
    editForm.images.splice(index, 1)
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isJPG = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleUpload: UploadRequestHandler = async (options) => {
  const { file, onSuccess, onError } = options
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const res = await request.post<string>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    editForm.images.push(res)
    onSuccess(res)
    ElMessage.success('图片上传成功')
  } catch (error) {
    onError(error as Error)
    ElMessage.error('图片上传失败')
  }
}

async function submit() {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
    
    if (editForm.images.length === 0) {
      ElMessage.warning('请至少上传一张图片')
      return
    }

    submitting.value = true
    
    await goodsApi.updateGoods(route.params.id as string, {
      title: editForm.title,
      description: editForm.description,
      price: editForm.price,
      category: editForm.category,
      images: editForm.images
    })
    
    ElMessage.success('修改成功')
    router.push('/my-goods')
  } catch (error) {
    console.error('Edit error:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadGoodsDetail()
})
</script>

<style lang="scss" scoped>
.edit-goods-container {
  min-height: 100vh;
  background: #F8F8F6;
}

.edit-goods-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);
  font-size: 18px;
  font-weight: 500;
}

.edit-goods-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.edit-form {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(107, 142, 123, 0.08);

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #4A4A4A;
  }
}
</style>
