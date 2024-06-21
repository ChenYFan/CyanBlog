import '@chenyfan/cache-db'
import '@chenyfan/cdnobject'


const this_Domain = new URL(self.location.href).host

//持久任务池

const PersistentTasks = {
    pool: [],
    add: function (task, run = true, interval = 1000 * 60, description = "这个任务没有描述") {
        this.pool.push({
            enable: true,
            function: task,
            interval: interval,
            description: description,
            lastrun: {
                time: 0
            }
        })
        if (run) {
            try { task().then(() => { }) } catch (e) { }
        }
    },
    run: async function (id) {
        if (!this.pool[id].enable) return false;
        if (this.pool[id].lastrun.time + this.pool[id].interval > new Date().getTime()) return false;
        await this.pool[id].function()
        cons.i(`Persistent Task <${this.pool[id].description}> Runned Just Now`)
        this.pool[id].lastrun.time = new Date().getTime()
    },
    runAll: async function () {
        return Promise.all(this.pool.map(async (item, index) => {
            return await this.run(index)
        }))
    },
    stop: function (id) {
        this.pool[id].enable = false
    },
    start: function (id) {
        this.pool[id].enable = true
    },
    clear: function () {
        this.pool = []
    }
}

const CyanACCPanel = "https://blog.eurekac.cn/panel"
self.cons = {
    s: (m) => {
        console.log(`%c[SUCCESS]%c ${m}`, 'color:white;background:green;', '')
    },
    w: (m) => {
        console.log(`%c[WARNING]%c ${m}`, 'color:brown;background:yellow;', '')
    },
    i: (m) => {
        console.log(`%c[INFO]%c ${m}`, 'color:white;background:blue;', '')
    },
    e: (m) => {
        console.log(`%c[ERROR]%c ${m}`, 'color:white;background:red;', '')
    },
    d: (m) => {
        console.log(`%c[DEBUG]%c ${m}`, 'color:white;background:black;', '')
    }
}

const db = new CacheDB('CyanAcc', "CyanAccDB")
const parallel_fetch = async (reqs, Config) => {
    return new Promise((resolve, reject) => {
        const abortEvent = new Event("abortOtherInstance")
        const eventTarget = new EventTarget();
        const error_fallback = setTimeout(() => {
            resolve([new Response('504 All GateWays Failed,CyanAcc Returned', { status: 504, statusText: '504 All Gateways Timeout' })])
        }, Config.timeoutL2)
        try {
            Promise.any(reqs.map(async req => {
                if (typeof req === 'string') req = new Request(req)
                let controller = new AbortController(), tagged = false;
                eventTarget.addEventListener(abortEvent.type, () => {
                    if (!tagged) controller.abort()
                })
                fetch(req, {
                    signal: controller.signal,
                    mode: new URL(req.url).host === this_Domain ? "same-origin" : "cors",
                    redirect: "follow"
                }).then(res => {
                    if (res.status === 200) {
                        tagged = true;
                        eventTarget.dispatchEvent(abortEvent)
                        clearTimeout(error_fallback)
                        resolve([res.clone(), req])
                    }
                }).catch(err => {
                    if (err == 'DOMException: The user aborted a request.') console.log()//To disable the warning:DOMException: The user aborted a request.
                })
            })).catch(err => {
                resolve([new Response('504 All GateWays Failed,CyanAcc Returned', { status: 504, statusText: '504 All Gateways Timeout' })])
            })
        } catch (e) {
            resolve([new Response('504 All GateWays Failed,CyanAcc Returned', { status: 504, statusText: '504 All Gateways Timeout' })])
        }
    })
}
function AssetsFetchWithCache(origin, urls, CacheConfig) {
    this.namespace = "AssetsCache"
    this.urls = urls
    this.origin = origin
    if (CacheConfig.origin) urls.push({
        url: origin.url,
        weight: 0,
        id: -1
    })

    this.CacheConfig = CacheConfig
    this.IntelligentFetch = async function () {
        if (this.CacheConfig.parallel) {
            let FetchPair = [new Response("IntelligentFetch Tried To Fetch:" + origin.url, { status: 500 })]
            while (FetchPair[0].status !== 200) {
                const fetchList = this.urls.slice(0, this.CacheConfig.threads)
                FetchPair = await parallel_fetch(fetchList.map(item => {
                    return this.rebuild.request(origin, item.url, this.CacheConfig.simpleFetch)
                }), this.CacheConfig)

                if (FetchPair[0].status !== 200) {
                    this.urls = this.urls.slice(this.CacheConfig.threads)
                    if (this.urls.length === 0) break;
                } else {
                    this.urls.map(async item => {
                        if (item.url === FetchPair[1].url) {
                            if (item.id === -1) return;
                            if (!CDN_Domain[item.id]) return;
                            CDN_Domain[item.id].weight++;
                            setTimeout(async () => {
                                await db.write('CDN_Domain', JSON.stringify(self.CDN_Domain))
                            }, 0);
                        }
                    });
                    break;
                }
            }
            return FetchPair
        } else {
            return fetch(origin)
        }
    }
    this.rebuild = {
        response: (res, init) => {
            const ResClone = new Response(res.body, init)
            ResClone.headers.set('Cache-Control', 'CyanAcc')
            ResClone.headers.set('Cache-Time', new Date().getTime())
            ResClone.headers.set('Cache-L1', this.CacheConfig.cacheL1)
            ResClone.headers.set('Cache-L2', this.CacheConfig.cacheL2)
            return ResClone
        },
        request: (req, url, simpleFetch) => {
            return simpleFetch ?
                new Request(url || req.url, {
                    method: req.method == 'GET' || req.method == 'HEAD' || req.method == 'POST' ? req.method : 'GET',
                    body: req.method == 'POST' ? req.body : null,
                }) :
                new Request(url || req, {
                    headers: req.headers,
                    mode: req.mode === 'navigate' ? "same-origin" : req.mode,
                    ...req
                })
        }
    }
    this.fetch = async function (force = false) {
        if (force) return (await this.IntelligentFetch())[0]
        return new Promise(async (resolve, reject) => {
            const cache = await caches.open(this.namespace)
            let OriginUrl = new URL(this.origin.url)
            if (!this.CacheConfig.ignore_search) OriginUrl.search = ''
            const cache_res = await cache.match(new Request(OriginUrl.toString()))
            const FetchWithWriteCache = async () => {
                const fetch_res = (await this.IntelligentFetch())[0]
                const rebuild_fetch_res = this.rebuild.response(
                    fetch_res.clone(),
                    this.CacheConfig.onlyBody ? {
                        status: fetch_res.status,
                        headers: {
                            "content-type": OriginUrl.pathname.endsWith('.html') ? "text/html;charset=UTF-8" : fetch_res.headers.get("content-type")
                        }
                    } : fetch_res.clone()
                )
                if (fetch_res.status === 200) await cache.put(new Request(OriginUrl.toString()), rebuild_fetch_res.clone())
                return rebuild_fetch_res.clone()
            }
            if (!cache_res) {
                resolve(await FetchWithWriteCache())
                return;
            } else {
                if (cache_res.headers.get('Cache-Control') !== 'CyanAcc') {
                    cons.w(`${origin.url} Cannot Be Refreshed Because It Is Not A CyanAcc Cache`)
                    resolve(cache_res)
                    return;
                }
                const cached_time = new Date().getTime() - Number(cache_res.headers.get('Cache-Time'))
                if (cached_time > Number(cache_res.headers.get('Cache-L1'))) {
                    cons.i(`${origin.url} Is Expired L1,Refreshing...`)
                    if (cached_time > Number(cache_res.headers.get('Cache-L2'))) {
                        cons.i(`${origin.url} Is Expired L2,Force Refreshing...`)
                        resolve(await FetchWithWriteCache())
                    } else {
                        resolve(
                            Promise.any([
                                FetchWithWriteCache(),
                                new Promise(async (resolve) => {
                                    setTimeout(async () => {
                                        resolve(cache_res.clone())
                                    }, this.CacheConfig.timeoutL1)
                                })
                            ])
                        )
                    }
                } else {
                    resolve(cache_res)
                }
            }
        })

    }
}

const Default_CDN_Fetch_Config = {
    enable: true,
    onlyBody: false,
    simpleFetch: true,
    parallel: true,
    ignore_search: true,
    threads: 2,
    origin: true,
    timeoutL1: 2000,
    timeoutL2: 5000,
    cache: true,
    cacheL1: 1000 * 60 * 60 * 24 * 7,
    cacheL2: 1000 * 60 * 60 * 24 * 30
}
const Default_Blog_Fetch_Config = {
    enable: true,
    onlyBody: true,
    simpleFetch: true,
    parallel: true,
    origin: true,
    ignore_search: false,
    domain: [
        "blog.eurekac.cn",
        "localhost:4000"
    ],
    auto_update: {
        enable: true,
        interval: 1000 * 60 * 60 * 4
    },
    mirrors: [
        {
            "type": "npm",
            "var": {
                "PACKAGE_NAME": "cyanblog",
                "PACKAGE_VERSION": "0.0.0-1700125816401",
                "PATH": "/"
            },
            "weight": 5
        },
        {
            "type": "url",
            "var": {
                "DOMAIN": "cyan-blog-three.vercel.app",
                "PATH": "/"
            },
            "weight": -7
        }
    ],
    threads: 2,
    timeoutL1: 2000,
    timeoutL2: 5000,
    cache: true,
    cacheL1: 1000 * 60 * 60,
    cacheL2: 1000 * 60 * 60 * 24
}
const Default_CDN_Domain = [
    {
        match: "(cdn|fastly)\\.jsdelivr\\.net",
        domain: "cdn.jsdelivr.net",
        concat: {
            "npm": "/npm(/@{{PACKAGE_SCOPE}})?/{{PACKAGE_NAME}}(@{{PACKAGE_VERSION}})?(/{{$FILE_PATH}})?",
            "github": "/gh/{{USER_NAME}}/{{REPO_NAME}}/{{$FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "cdnjs\\.cloudflare\\.com",
        domain: "cdnjs.cloudflare.com",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{$FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "cdn\\.bootcdn\\.net",
        domain: "cdn.bootcdn.net",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{$FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "unpkg\\.com",
        domain: "unpkg.com",
        concat: {
            "npm": "/{{PACKAGE_NAME}}(@{{PACKAGE_VERSION}})?/{{$FILE_PATH}}"
        },
        weight: 1
    },
    {
        match: "cdn\\.staticfile\\.org",
        domain: "cdn.staticfile.org",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{$FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "registry\\.npmmirror\\.com",
        domain: "cdn.eurekac.cn",
        concat: {
            "npm": "(/@{{PACKAGE_SCOPE}})?/{{PACKAGE_NAME}}(/{{PACKAGE_VERSION}})?/files(/{{$FILE_PATH}})"
        },
        weight: 10
    }
]
const Default_CyanAcc_Config = {
    enable: true,
    reinit: true,
    PersistentTasks: {
        enable: true,
        interval: 1000
    },
    AutoClear: {
        enable: true,
        interval: 1000 * 60
    }
}




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
        
        //event.respondWith(handleRequest(event.request)) //Actually,it does'nt work good without npmmirror
        event.respondWith(fetch(event.request))
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
        self.Blog_Fetch_Config = JSON.parse(await db.readWithDefault('Blog_Fetch_Config', JSON.stringify(Default_Blog_Fetch_Config)))
        self.CDN_Domain = JSON.parse(await db.readWithDefault('CDN_Domain', JSON.stringify(Default_CDN_Domain)))
        self.CDN_Fetch_Config = JSON.parse(await db.readWithDefault('CDN_Fetch_Config', JSON.stringify(Default_CDN_Fetch_Config)))
        self.CyanAccConfig = JSON.parse(await db.readWithDefault('CyanAcc_Config', JSON.stringify(Default_CyanAcc_Config)))
        if (CyanAccConfig.PersistentTasks.enable && typeof self.CyanAccInterVal === 'undefined') {
            cons.i("CyanAcc正在启动持久任务池...")
            if (Blog_Fetch_Config.auto_update.enable) PersistentTasks.add(UpdateBlogVersion, false, Blog_Fetch_Config.auto_update.interval, "CyanAcc自动更新博客版本进程")
            if (CyanAccConfig.AutoClear.enable) PersistentTasks.add(AutoClear, false, CyanAccConfig.AutoClear.interval, "CyanAcc自动清理缓存进程")
            self.CyanAccInterVal = setInterval(async () => {
                await PersistentTasks.runAll()
            }, CyanAccConfig.PersistentTasks.interval)
        } else {
            cons.w("CyanAcc持久任务池被禁用或者已经启动")
        }
    }
    if (!CyanAccConfig.enable) return fetch(request)
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
    //return fetch(request)
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
        const res = await BlogRouter(new Request(CyanACCPanel + PreducePath(url).replace(/^CyanAcc/g, '') + ((new URL(request.url)).search || '')))
        //const res = await fetch(new Request('http://localhost:5173/CyanAcc' + PreducePath(url).replace(/^CyanAcc/g, '') + ((new URL(request.url)).search || '')))
        //The Origin Url Will Cause Vue Slibing Error,So It has to rebuild Response
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