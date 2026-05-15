import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/goods/:id',
    name: 'GoodsDetail',
    component: () => import('@/views/Goods/Detail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('@/views/Goods/Publish.vue'),
    meta: { title: '发布商品', requiresAuth: true }
  },
  {
    path: '/edit/:id',
    name: 'Edit',
    component: () => import('@/views/Goods/Edit.vue'),
    meta: { title: '编辑商品', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/Favorites/index.vue'),
    meta: { title: '我的收藏', requiresAuth: true }
  },
  {
    path: '/my-goods',
    name: 'MyGoods',
    component: () => import('@/views/MyGoods/index.vue'),
    meta: { title: '我的商品', requiresAuth: true }
  },
  {
    path: '/my-messages',
    name: 'MyMessages',
    component: () => import('@/views/MyMessages/index.vue'),
    meta: { title: '我的留言', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/dashboard',
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/Admin/Dashboard.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'goods',
        name: 'AdminGoods',
        component: () => import('@/views/Admin/Goods.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/Admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'messages',
        name: 'AdminMessages',
        component: () => import('@/views/Admin/Messages.vue'),
        meta: { title: '留言管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || '校园二手'} - 校园二手交易平台`
  
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/')
    return
  }
  
  if (to.meta.guest && userStore.isLoggedIn) {
    next('/')
    return
  }
  
  next()
})

export default router
