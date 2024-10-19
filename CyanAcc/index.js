import '@chenyfan/cache-db'
import '@chenyfan/cdnobject'
import PersistentTasks from './utils/PersistentTasks.js'
import EasyConsole from './utils/EasyConsole.js'
import ParallelFetch from './utils/ParallelFetch.js'
import AssetsFetchWithCache from './utils/AssetsFetchWithCache.js'

import DefaultConfig from './utils/DefaultConfig.js'


self.cons = EasyConsole


const ThisProtocol = new URL(self.location.href).protocol
const ThisDomain = new URL(self.location.href).host
const ThisRootUrl = ThisProtocol + "//" + ThisDomain


const CyanACCPanelRootUrl = ThisRootUrl + "/panel"

const db = new CacheDB('CyanAcc', "CyanAccDB", { auto: 1 })




// const Default_CDN_Fetch_Config = DefaultConfig.Default_CDN_Fetch_Config
// const Default_Blog_Fetch_Config = DefaultConfig.Default_Blog_Fetch_Config
// const Default_CDN_Domain = DefaultConfig.Default_CDN_Domain
// const Default_CyanAcc_Config = DefaultConfig.Default_CyanAcc_Config

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
const PreducePath = (urlObj) => {
    let pathname = urlObj.pathname || '/'
    pathname = pathname
        .replace(/\/$/, '/index.html')
        .replace(/^\//, '')
    return pathname
}


addEventListener('fetch', event => {
    try {
        event.respondWith(handleRequest(event.request)) //Actually,it does'nt work good without npmmirror
        //event.respondWith(fetch(event.request))
    } catch (e) {
        cons.e(`Fatal Error,CyanAcc Will Be disabled:${e}`)
        event.respondWith(fetch(event.request))
        return;
    }
})
addEventListener('install', function () {
    self.skipWaiting();

});
addEventListener('activate', function () {
    try {
        self.clients.claim();
    } catch (e) {
        console.log(e)
    }
})


const handleRequest = async (request) => {
    const domain = (new URL(request.url)).host
    if (typeof self.init === 'undefined' || !self.init) {
        cons.i(`CyanAcc正在重新初始化...在${request.url}`)
        self.init = true
        self.initTime = new Date().getTime()
        // self.Blog_Fetch_Config = JSON.parse(await db.readWithDefault('Blog_Fetch_Config', JSON.stringify(Default_Blog_Fetch_Config)))
        // self.CDN_Domain = JSON.parse(await db.readWithDefault('CDN_Domain', JSON.stringify(Default_CDN_Domain)))
        // self.CDN_Fetch_Config = JSON.parse(await db.readWithDefault('CDN_Fetch_Config', JSON.stringify(Default_CDN_Fetch_Config)))
        // self.CyanAccConfig = JSON.parse(await db.readWithDefault('CyanAcc_Config', JSON.stringify(Default_CyanAcc_Config)))
        self.Blog_Fetch_Config = await db.read('Blog_Fetch_Config', { default: DefaultConfig.Blog_Fetch_Config })
        self.CDN_Domain = await db.read('CDN_Domain', { default: DefaultConfig.CDN_Domain })
        self.CDN_Fetch_Config = await db.read('CDN_Fetch_Config', { default: DefaultConfig.CDN_Fetch_Config })
        self.CyanAccConfig = await db.read('CyanAcc_Config', { default: DefaultConfig.CyanAcc_Config })

        if (CyanAccConfig.PersistentTasks.enable && typeof self.CyanAccInterVal === 'undefined') {
            cons.i("CyanAcc正在启动持久任务池...")
            //if (Blog_Fetch_Config.auto_update.enable) PersistentTasks.add(UpdateBlogVersion, false, Blog_Fetch_Config.auto_update.interval, "CyanAcc自动更新博客版本进程")
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
    if (Blog_Fetch_Config.domain.includes(domain)) return BlogRouter(request)
    for (var cdnitem of CDN_Domain) {
        if (request.url.match(new RegExp(cdnitem.match))) return CDNRouter(request)
    }
    return fetch(request)
}
const BlogRouter = async (request) => {
    const urlStr = request.url
    const urlObj = new URL(urlStr)
    if (urlObj.pathname.startsWith('/CyanAcc')) return CyanAccRouter(request)
    if (!Blog_Fetch_Config.enable) return fetch(request)
    const path = PreducePath(urlObj)
    const SortMirrors = Blog_Fetch_Config.mirrors.sort((b, a) => {
        return a.weight - b.weight
    })
    const RequestList = []
    for (var item of SortMirrors) {
        switch (item.type) {
            case 'url':
                RequestList.push({
                    url: `https://${item.var.DOMAIN}${item.var.PATH}${path}`,
                    weight: item.weight,
                    id: -1
                })
                break;
            case 'npm':
                var CDN = new CDNObject(`https://cdn.eurekac.cn/npm/${item.var.PACKAGE_NAME}/${item.var.PACKAGE_VERSION}/files${item.var.PATH}${path}`)
                var NPMMirrors = CDN.get_all_mirrors().sort((b, a) => {
                    return a.weight - b.weight
                })
                for (var mirror of NPMMirrors) {
                    RequestList.push({
                        url: CDN.generate_mirror(mirror.domain).url,
                        weight: item.weight + mirror.weight,
                        id: mirror.id
                    })
                }

        }
    }
    return (new AssetsFetchWithCache(request, RequestList, Blog_Fetch_Config)).fetch()
}
const CDNRouter = async (request) => {
    request = new Request(request.url.replace(/^http\:/g, "https:"), request)
    if (!CDN_Fetch_Config.enable) return fetch(request)
    const CDN = new CDNObject(request.url)
    if (!CDN.valid) return fetch(request)
    const mirrors = CDN.get_all_mirrors().sort((b, a) => {
        return a.weight - b.weight
    })
    return (new AssetsFetchWithCache(CDN, mirrors.map(item => {
        return {
            url: CDN.generate_mirror(item.domain).url,
            weight: item.weight,
            id: item.id
        }
    }), CDN_Fetch_Config)).fetch()
}
const CyanAccRouter = async (request) => {
    const url = new URL(request.url)
    const path = url.pathname.replace('/CyanAcc', '')
    const CyanAccAPIRouter = async (request) => {
        if (request.method !== "POST") return new Response('Method Not Allowed', { status: 405 })
        const APIBody = await request.text()
        try { JSON.parse(APIBody) } catch (err) { return new Response('Bad Request', { status: 400 }) }
        const data = JSON.parse(APIBody)
        const action = data.action
        switch (action) {
            case 'PING':
                return new Response(JSON.stringify({ status: "OK", data: "PONG" }))
            case 'REINIT':
                self.init = false
                return new Response(JSON.stringify({ status: "OK", data: "SET INIT AS FALSE" }))
            case 'DUMP_VAR_TASKLIST':
                return new Response(JSON.stringify({ status: "OK", data: PersistentTasks.pool }))
            case 'GET_CACHE_SIZE':
                const AssetsCache = await caches.open("AssetsCache")
                const AssetsCachekeys = await AssetsCache.keys()
                const Precise = data.precise
                let CacheSize = 0
                for (var key of AssetsCachekeys) {
                    const value = await AssetsCache.match(key)
                    CacheSize += Number(await GetResponseRealSize(value, Precise))
                }
                return new Response(JSON.stringify({ status: "OK", data: CacheSize }))
            case 'GET_INIT_TIME':
                return new Response(JSON.stringify({ status: "OK", data: self.initTime }))
            default:
                return new Response('Bad Request', { status: 400 })
        }
    }
    const CyanAccPanel = async (request) => {
        const res = await BlogRouter(new Request(CyanACCPanelRootUrl + PreducePath(url).replace(/^CyanAcc/g, '') + ((new URL(request.url)).search || '')))
        return new Response(res.body, {
            headers: {
                "content-type": request.url.split('?')[0].endsWith('.html') ? "text/html;charset=UTF-8" : res.headers.get("content-type")
            }
        })
    }
    const GenerateCustomCode = async (type) => {
        const GenJS = async () => {
            return 'console.log("CyanAcc自定义脚本执行成功")'
        }
        const GenCSS = async () => {
            return ``
        }
        switch (type) {
            case 'js':
                return new Response(await GenJS(), { headers: { "content-type": "application/javascript;charset=UTF-8" } })
            case 'css':
                return new Response(await GenCSS(), { headers: { "content-type": "text/css;charset=UTF-8" } })
            default:
                return new Response('Bad Request', { status: 400 })
        }
    }
    switch (path) {
        case '':
            return Response.redirect('/CyanAcc/')
        case '/custom.js':
            return GenerateCustomCode("js")
        case '/custom.css':
            return GenerateCustomCode("css")
        case '/api':
            return CyanAccAPIRouter(request)
        default:
            return CyanAccPanel(request)
    }
}



const GetResponseRealSize = async (res, precise) => {
    const headers = res.headers
    const body = res.body
    const contentLength = precise ? (await res.arrayBuffer()).byteLength : (headers.get('content-length') || body.byteLength || (await res.arrayBuffer()).byteLength || 0)
    return contentLength
}