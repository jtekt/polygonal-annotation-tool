import Vue from 'vue'
import VueRouter from 'vue-router'
import CollectionList from '../views/CollectionList.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    omponent: CollectionList,
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/:collection',
    name: 'collection',
    component: () => import('../views/Collection.vue')
  },
  {
    path: '/:collection/:document_id',
    name: 'annotate',
    component: () => import('../views/Annotate.vue')
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
