import * as VueRouter from 'vue-router'

const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('./components/page/dashboard.vue') },
    //{ path: '/font', component: () => import('./components/page/font.vue') },
    { path: '/darkmode', component: () => import('./components/page/darkmode.vue') },
    { path: '/comment', component: () => import('./components/page/comment.vue') },
    { path: '/cdnFetch', component: () => import('./components/page/cdn/cdnFetch.vue') },
    { path: '/cdnDomainConfig', component: () => import('./components/page/cdn/cdnDomainConfig.vue') },
    { path: '/cyanacc', component: () => import('./components/page/cyanacc.vue') },
    { path: '/blogFetch', component: () => import('./components/page/blogFetch.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('./components/page/404.vue') }
]
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
})
export default router