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


self.ThisProtocol = new URL(self.location.href).protocol
self.ThisDomain = new URL(self.location.href).host
self.ThisRootUrl = self.ThisProtocol + "//" + self.ThisDomain
self.CyanACCPanelRootUrl = self.ThisRootUrl + "/panel"




const db = new CacheDB('CyanAcc', "CyanAccDB", { auto: 1 })

const UpdateBlogVersion = async () => {
    for (var mirror of Blog_Fetch_Config.mirrors) {
        if (mirror.type !== "npm") continue;
        const BlogCDNObject = new CDNObject(`https://cdn.eurekac.cn/npm/${mirror.var.PACKAGE_NAME}/${mirror.var.PACKAGE_VERSION}/files/`)
        const BlogCDNObject_NewestVersion = await BlogCDNObject.getNewestVersion()
        if (BlogCDNObject_NewestVersion === mirror.var.PACKAGE_VERSION) continue;
        else {
            mirror.var.PACKAGE_VERSION = BlogCDNObject_NewestVersion
            Blog_Fetch_Config.domain.map(async domain => {
                await SetAllDomainCacheImmediatlyExpired(domain)
            });
            await db.write('Blog_Fetch_Config', JSON.stringify(self.Blog_Fetch_Config))
            return true
        }
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


addEventListener('fetch', event => {
    try {
        event.respondWith(handleRequest(event.request)) //Actually,it does'nt work good without npmmirror
    } catch (e) {
        cons.e(`Fatal Error,CyanAcc Will Be disabled:${e}`)
        event.respondWith(fetch(event.request))
        return;
    }
})
addEventListener('install', () => self.skipWaiting())
addEventListener('activate', () => self.clients.claim());


const handleRequest = async (request) => {
    const ReqDomain = new URL(request.url).host
    const ReqUrl = request.url
    if (typeof self.init === 'undefined' || !self.init) {
        cons.i(`CyanAcc正在重新初始化...在${request.url}`)
        self.init = true
        self.initTime = new Date().getTime()
        self.Blog_Fetch_Config = await db.read('Blog_Fetch_Config', { default: DefaultConfig.Blog_Fetch_Config })
        self.CDN_Domain = await db.read('CDN_Domain', { default: DefaultConfig.CDN_Domain })
        self.CDN_Fetch_Config = await db.read('CDN_Fetch_Config', { default: DefaultConfig.CDN_Fetch_Config })
        self.CyanAccConfig = await db.read('CyanAcc_Config', { default: DefaultConfig.CyanAcc_Config })
        if (CyanAccConfig.PersistentTasks.enable && typeof self.CyanAccInterVal === 'undefined') {
            cons.i("CyanAcc正在启动持久任务池...")
            if (CyanAccConfig.AutoClear.enable) PersistentTasks.add(AutoClear, false, CyanAccConfig.AutoClear.interval, "CyanAcc自动清理缓存进程")
            self.CyanAccInterVal = setInterval(async () => {
                await PersistentTasks.runAll()
            }, CyanAccConfig.PersistentTasks.interval)
        } else {
            cons.w("CyanAcc持久任务池被禁用或者已经启动")
        }
        self.initFinished = true
    }
    while (!self.initFinished) {
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!CyanAccConfig.enable) {
        cons.w("CyanAcc已被禁用")
        return fetch(request)
    }
    if (Blog_Fetch_Config.domain.includes(ReqDomain)) return BlogRouter(request)
    for (var cdnitem of CDN_Domain) if (ReqUrl.match(new RegExp(cdnitem.match))) return CDNRouter(request)
    return fetch(request)
}



const GetResponseRealSize = async (res, precise) => {
    const headers = res.headers
    const body = res.body
    const contentLength = precise ? (await res.arrayBuffer()).byteLength : (headers.get('content-length') || body.byteLength || (await res.arrayBuffer()).byteLength || 0)
    return contentLength
}