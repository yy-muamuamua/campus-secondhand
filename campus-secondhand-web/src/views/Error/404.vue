<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" size="large" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F8F6;
}

.not-found-content {
  text-align: center;
  padding: 48px;
}

.error-code {
  font-size: 120px;
  font-weight: 800;
  color: #6B8E7B;
  line-height: 1;
  margin-bottom: 24px;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 16px;
}

.error-desc {
  color: #7A7A7A;
  font-size: 16px;
  margin-bottom: 32px;
}
</style>
