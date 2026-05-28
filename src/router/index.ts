import { createRouter, createWebHistory } from 'vue-router'
import ImageList from '@/views/ImageList.vue'

const routes = [
    {
        path: '/',
        redirect: '/images',
    },
    {
        path: '/images',
        name: 'images',
        component: ImageList,
    },
    {
        path: '/images/:document_id/annotate',
        name: 'annotate',
        component: () => import('@/views/Annotate.vue'),
    },
    {
        path: '/about',
        name: 'about',
        component: () => import('@/views/About.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not_found',
        component: () => import('@/views/NotFound.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
