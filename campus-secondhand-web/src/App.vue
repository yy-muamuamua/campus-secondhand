<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/useUserStore'

onMounted(async () => {
  const userStore = useUserStore()
  if (userStore.accessToken && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
