import Vue from 'vue'
import VueRouter from 'vue-router'
import CollectionList from '@/views/CollectionList.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: CollectionList,
  },
  {
    path: '/collections',
    name: 'collection_list',
    component: CollectionList,
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/collections/:collection',
    name: 'collection',
    component: () => import('@/views/Collection.vue')
  },
  {
    path: '/collections/:collection/images/:document_id/annotate',
    name: 'annotate',
    component: () => import('@/views/Annotate.vue')
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
