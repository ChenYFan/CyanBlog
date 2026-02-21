import '@chenyfan/cache-db'
import '@chenyfan/cdnobject'
import PersistentTasks from './utils/PersistentTasks.js'
import EasyConsole from './utils/EasyConsole.js'
import ParallelFetch from './utils/ParallelFetch.js'
import AssetsFetchWithCache from './utils/AssetsFetchWithCache.js'

import DefaultConfig from './utils/DefaultConfig.js'

import BlogRouter from './src/BlogRouter.js'
import CDNRouter from './src/CDNRouter.js'


self.cons = EasyConsole

self.init = false
self.initFinished = false
self.self_disable = false
self.initTimeout = 0
self.ThisProtocol = new URL(self.location.href).protocol
self.ThisDomain = new URL(self.location.href).host
self.ThisRootUrl = self.ThisProtocol + "//" + self.ThisDomain
self.CyanACCPanelRootUrl = self.ThisRootUrl + "/panel"
self.PersistentTasksInstance = undefined



const db = new CacheDB('CyanAcc', "CyanAccDB", { auto: 1 })
addEventListener('install', () => self.skipWaiting())
addEventListener('activate', () => {
    self.clients.claim()
    console.log("CyanAcc Service Worker Activated.")
    if (!self.init || !self.initFinished) initCyanAcc()
});
addEventListener('fetch', event => {
    try {
        event.respondWith(handleRequest(event.request)) //Actually,it does'nt work good without npmmirror
    } catch (e) {
        cons.e(`Fatal Error,CyanAcc Will Be disabled:${e}`)
        event.respondWith(fetch(event.request))
        return;
    }
})

const handleRequest = async (request) => {
    if (self.self_disable) {
        cons.w("CyanAcc已被自身临时禁用，将在下次重启后自动启用，现放行请求：", request.url)
        return fetch(request)
    }
    if (request.headers.get('no-CyanAcc')) {
        cons.w(`请求头中包含no-CyanAcc，已放行请求： ${request.url} `)
        return fetch(request)
    }
    const ReqDomain = new URL(request.url).host
    const ReqUrl = request.url
    if (!self.init) {
        cons.w(`在 ${request.url} 请求时，CyanAcc尚未完成初始化，正在初始化...`)
        self.init = true
        await initCyanAcc()
    }
    if (!self.initFinished) {
        cons.i(`在 ${request.url} 请求时，CyanAcc已进行初始化但尚未完成，正在等待初始化完成...`)
        let TimeoutPromise = 0
        while (!self.initFinished) {
            if (TimeoutPromise > 10) {
                self.init_timeout++
                cons.e(`在 ${request.url} 请求时，CyanAcc初始化超时，已直接放行，当前初始化请求超时次数：${self.init_timeout}`)
                return fetch(request)
            }
            await new Promise(resolve => setTimeout(resolve, 80))
            TimeoutPromise++
        }
    }
    if (!CyanAccConfig.enable) {
        cons.w("CyanAcc已被永远禁用，现放行请求：", request.url)
        return fetch(request)
    }
    if (Blog_Fetch_Config.domain.includes(ReqDomain)) return BlogRouter(request)
    for (var cdnitem of CDN_Domain) if (ReqUrl.match(new RegExp(cdnitem.match))) return CDNRouter(request)
    cons.w(`未找到合适的路由，已放行请求： ${request.url} `)
    return fetch(request)
}


const initCyanAcc = async () => {
    self.init = true
    try {
        self.Blog_Fetch_Config = await db.read('Blog_Fetch_Config', { default: DefaultConfig.Blog_Fetch_Config })
        self.CDN_Domain = await db.read('CDN_Domain', { default: DefaultConfig.CDN_Domain })
        self.CDN_Fetch_Config = await db.read('CDN_Fetch_Config', { default: DefaultConfig.CDN_Fetch_Config })
        self.CyanAccConfig = await db.read('CyanAcc_Config', { default: DefaultConfig.CyanAcc_Config })
        if (self.CyanAccConfig.PersistentTasks.enable && typeof self.PersistentTasksInstance === 'undefined') {
            cons.i("CyanAcc正在启动持久任务池...")
            self.PersistentTasksInstance = new PersistentTasks()
            self.PersistentTasksInstance.add(AutoClear, false, self.CyanAccConfig.AutoClear.interval, "自动清理缓存进程", self.CyanAccConfig.AutoClear.enable)
            self.PersistentTasksInstance.add(UpdateBlogVersion, true, self.CyanAccConfig.BlogVersionCheck.interval, "博客版本更新检测进程", self.CyanAccConfig.BlogVersionCheck.enable)
            self.PersistentTasksInstance.startInterval(Math.max([self.CyanAccConfig.PersistentTasks.interval || 5 * 1000, 5 * 1000]))
        }
        else cons.w("CyanAcc持久任务池被禁用或者已经启动")
        self.initTime = new Date().getTime()
        self.initFinished = true
    } catch (e) {
        cons.e(`CyanAcc初始化失败，已直接放行，原因：${e}`)
        self.initFinished = true
    }
}



const UpdateBlogVersion = async () => {
    // for (var mirror of Blog_Fetch_Config.mirrors) {
    //     if (mirror.type !== "npm") continue;
    //     const BlogCDNObject = new CDNObject(`https://cdn.eurekac.cn/npm/${mirror.var.PACKAGE_NAME}/${mirror.var.PACKAGE_VERSION}/files/`)
    //     const BlogCDNObject_NewestVersion = await BlogCDNObject.getNewestVersion()
    //     if (BlogCDNObject_NewestVersion === mirror.var.PACKAGE_VERSION) continue;
    //     else {
    //         mirror.var.PACKAGE_VERSION = BlogCDNObject_NewestVersion
    //         Blog_Fetch_Config.domain.map(async domain => {
    //             await SetAllDomainCacheImmediatlyExpired(domain)
    //         });
    //         await db.write('Blog_Fetch_Config', JSON.stringify(self.Blog_Fetch_Config))
    //         return true
    //     }
    // }
    const BlogNewstVersion = Number((await fetch("/package.json?_t=" + new Date().getTime()).then(res => res.json()).then(data => data.version).catch(e => { cons.e(`更新版本失败，原因：` + e); return "0.0.0-0"; })).split('-')[1])
    const BlogOldVersion = Number(await db.read('Blog_Version', { default: "0.0.0-0" }))
    if (BlogNewstVersion > BlogOldVersion) {
        await db.write('Blog_Version', BlogNewstVersion)
        await SetAllDomainCacheImmediatlyExpired(self.ThisDomain)
        cons.i(`检测到博客版本更新，已将版本号更新为${BlogNewstVersion}，并将所有缓存标记为过期`)
    }

}

const SetAllDomainCacheImmediatlyExpired = async (domain) => {
    const cache = await caches.open("AssetsCache")
    const keys = await cache.keys()
    for (var key of keys) {
        const value = await cache.match(key)
        if (new URL(key.url).host === domain) {
            const headers = value.headers
            const body = value.body
            headers.set('Cache-L1', 0)
            const newRes = new Response(body, {
                headers
            })
            await cache.put(key, newRes)
        }
    }
    return true
}


const AutoClear = async () => {
    const cache = await caches.open("AssetsCache")
    const keys = await cache.keys()
    const now = new Date().getTime()
    for (var key of keys) {
        const value = await cache.match(key)
        if (now - Number(value.headers.get('Cache-Time')) > Number(value.headers.get('Cache-L2'))) await cache.delete(key)
    }
}
