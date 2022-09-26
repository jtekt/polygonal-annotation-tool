import Vue from 'vue'
import VueRouter from 'vue-router'
import ImageList from '@/views/ImageList.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/images',
    alias: '/',
    name: 'images',
    component: ImageList,
  },
  {
    path: '/images/:document_id/annotate',
    name: 'annotate',
    component: () => import('@/views/Annotate.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/*',
    name: 'not_found',
    component: () => import('@/views/NotFound.vue')
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
