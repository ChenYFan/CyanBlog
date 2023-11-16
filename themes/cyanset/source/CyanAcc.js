const this_Domain = new URL(self.location.href).host
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
function CacheDB(namespace, prefix) {
    this.namespace = namespace || "CacheDBDefaultNameSpace";
    this.prefix = prefix || "CacheDBDefaultPrefix";
    this.read = async function (key, config) {
        config = config || { type: "text" };
        return new Promise((resolve, reject) => {
            caches.open(this.namespace).then(cache => {
                cache.match(new Request(`https://${this.prefix}/${encodeURIComponent(key)}`))
                    .then(response => {
                        switch (config.type) {
                            case "json":
                                resolve(response.json());
                                return;
                            case "arrayBuffer":
                                resolve(response.arrayBuffer());
                                return;
                            case 'blob':
                                resolve(response.blob());
                                return;
                            default:
                                resolve(response.text());
                                return;
                        }
                    }).catch(err => { resolve(null); });
            })
        })
    }
    this.write = async function (key, value, config) {
        config = config || { type: "text" };
        return new Promise((resolve, reject) => {
            caches.open(this.namespace).then(cache => {
                cache.put(
                    new Request(`https://${this.prefix}/${encodeURIComponent(key)}`),
                    new Response(value, {
                        headers: {
                            'Content-Type': (() => {
                                switch (config.type) {
                                    case "json":
                                        return 'application/json';
                                    case "arrayBuffer":
                                        return 'application/octet-stream';
                                    case 'blob':
                                        return 'application/octet-stream';
                                    default:
                                        return 'text/plain';
                                }
                            })()
                        }
                    }))
                    .then(resolve(true))
                    .catch(err => { resolve(false) });
            })
        })
    }
    this.readWithDefault = async function (key, value, config) {
        const ReadData = await this.read(key, config)
        if (!ReadData) await this.write(key, value, config)
        return ReadData || value
    }
    this.delete = async function (key) {
        return new Promise((resolve, reject) => {
            caches.open(this.namespace).then(cache => {
                cache.delete(new Request(`https://${this.prefix}/${encodeURIComponent(key)}`))
                    .then(resolve(true))
                    .catch(err => { resolve(false) });
            })
        })
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
                })
                    .catch(err => {
                        if (err == 'DOMException: The user aborted a request.') console.log()//To disable the warning:DOMException: The user aborted a request.
                    })
            }))
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
                    return this.rebuild.request(origin, item.url)
                }), this.CacheConfig)
            
                if (FetchPair[0].status !== 200) {
                    this.urls = this.urls.slice(this.CacheConfig.threads)
                    if (this.urls.length === 0) break;
                } else {
                    this.urls.map(async item => {
                        if (item.url === FetchPair[1].url) {
                            if (!CDN_Domain[item.id]) return;
                            CDN_Domain[item.id].weight++;
                            await db.write('CDN_Domain', JSON.stringify(CDN_Domain))
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
        response: (res) => {
            return new Response(res.body, {
                headers: {
                    ...res.headers,
                    'Cache-Control': 'CyanAcc',
                    'Cache-Time': new Date().getTime(),
                    'Cache-L1': this.CacheConfig.cacheL1,
                    'Cache-L2': this.CacheConfig.cacheL2
                },
                ...res
            })
        },
        request: (req, url) => {
            return new Request(url || req, {
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
            const cache_res = await cache.match(new Request(this.origin))
            const FetchWithWriteCache = async () => {
                const fetch_res = (await this.IntelligentFetch())[0]
                if (fetch_res.status === 200) await cache.put(new Request(this.origin), this.rebuild.response(fetch_res.clone()))

                return fetch_res
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
                if (cached_time > this.CacheConfig.cacheL1) {
                    cons.i(`${origin.url} Is Expired L1,Refreshing...`)
                    if (cached_time > this.CacheConfig.cacheL2) {
                        cons.i(`${origin.url} Is Expired L2,Force Refreshing...`)
                        resolve(await FetchWithWriteCache())
                    } else {
                        resolve(
                            Promise.all([
                                FetchWithWriteCache(),
                                new Promise(async (resolve) => {
                                    setTimeout(async () => {
                                        resolve(cache_res.clone())
                                    }, this.CacheConfig.timeoutL1)
                                })
                            ])
                        )
                    }
                }
            }
        })

    }
}

const Default_CDN_Fetch_Config = {
    enable: true,
    parallel: true,
    ignore_search: true,
    threads: 4,
    origin: true,
    timeoutL1: 2000,
    timeoutL2: 5000,
    cache: true,
    cacheL1: 1000 * 60 * 60 * 24 * 7,
    cacheL2: 1000 * 60 * 60 * 24 * 30
}
const Default_Blog_Fetch_Config = {
    enable: true,
    parallel: true,
    origin: false,
    ignore_search: false,
    mirrors: [
        {
            "type": "npm",
            "PACKAGE_NAME": "cyanblog",
            "PACKAGE_VERSION": "0.0.0-1695866870416",
            "weight": 5
        }
    ],
    threads: 2,
    timeoutL1: 2000,
    timeoutL2: 5000,
    cache: true,
    cacheL1: 1000 * 60 * 60,
    cacheL2: 1000 * 60 * 60 * 24
}

const Default_Blog_Domain = [
    "blog.eurekac.cn",
    "localhost:4000"
]
const Default_CDN_Domain = [
    {
        match: "(cdn|fastly)\.jsdelivr\.net",
        domain: "cdn.jsdelivr.net",
        concat: {
            "npm": "/npm/{{PACKAGE_NAME}}@{{PACKAGE_VERSION}}/{{FILE_PATH}}",
            "github": "/gh/{{REPO_NAME}}@{{REPO_VERSION}}/{{FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "cdnjs\.cloudflare\.com",
        domain: "cdnjs.cloudflare.com",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "cdn\.bootcdn\.net",
        domain: "cdn.bootcdn.net",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        },
        weight: 0
    },
    {
        match: "unpkg\.com",
        domain: "unpkg.com",
        concat: {
            "npm": "/{{PACKAGE_NAME}}@{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        },
        weight: 1
    },
    {
        match: "cdn\.staticfile\.org",
        domain: "cdn.staticfile.org",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        }
    },
    {
        match: "lib\.baomitu\.com",
        domain: "lib.baomitu.com",
        concat: {
            "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        },
        weight: 2
    },
    {
        match: "npm\.elemecdn\.com",
        domain: "npm.elemecdn.com",
        concat: {
            "npm": "/{{PACKAGE_NAME}}@{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        },
        weight: 3
    },
    {
        match: "unpkg\.zhimg\.com",
        domain: "unpkg.zhimg.com",
        concat: {
            "npm": "/{{PACKAGE_NAME}}@{{PACKAGE_VERSION}}/{{FILE_PATH}}"
        },
        weight: -1
    },
    {
        match: "registry\.npmmirror\.com",
        domain: "registry.npmmirror.com",
        concat: {
            "npm": "/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/files/{{FILE_PATH}}"
        },
        weight: 10
    }
]
    ; (async () => {
        self.Blog_Domain = JSON.parse(await db.readWithDefault('Blog_Domain', JSON.stringify(Default_Blog_Domain)))
        self.Blog_Fetch_Config = JSON.parse(await db.readWithDefault('Blog_Fetch_Config', JSON.stringify(Default_Blog_Fetch_Config)))
        self.CDN_Domain = JSON.parse(await db.readWithDefault('CDN_Domain', JSON.stringify(Default_CDN_Domain)))
        self.CDN_Fetch_Config = JSON.parse(await db.readWithDefault('CDN_Fetch_Config', JSON.stringify(Default_Blog_Fetch_Config)))
    })();
function CDNObject(url) {
    this.valid = false
    if (!(typeof url === 'string' || typeof url === typeof (new URL('')))) throw new Error('Invalid URL')
    this.url = url
    this.urlObject = new URL(url)
    this.id = CDN_Domain.findIndex(item => {
        return new RegExp(item.match).test(url)
    })
    if (this.id === -1) throw new Error('CDN Not Found:' + url)
    for (var prefix in CDN_Domain[this.id].concat) {
        if (url.replace("https://" + CDN_Domain[this.id].domain, '').startsWith(CDN_Domain[this.id].concat[prefix].split("{{")[0])) {
            this.type = prefix
            break
        }
    }
    this.domain = CDN_Domain[this.id].domain
    if (!this.type) throw new Error('CDN Prefix Not Found:' + url)
    const var_reg = url.match(new RegExp(
        CDN_Domain[this.id]
            .concat[this.type]
            .replace("{{PACKAGE_NAME}}", "(?<PACKAGE_NAME>(\@[^\/]+\/[^\/]+)|([^\/]+))")
            .replace("/{{FILE_PATH}}", "(\/(?<FILE_PATH>.+)|)")
            .replace(/\{\{(.*?)\}\}/g, '(?<$1>[^\/]+)')
            .replace(/\//g, '\\/')
    ))
    this.var = var_reg.groups
    for (var item in this.var) {
        if (this.var[item] === undefined) this.var[item] = ""
    }
    this.valid = true
    this.generate_mirror = function (domain) {
        const gid = CDN_Domain.findIndex(item => { return item.domain === domain })
        if (gid === -1) throw new Error('CDN Mirror Not Found')
        if (!CDN_Domain[gid].concat[this.type]) throw new Error('This Mirror Has No Such Prefix: ' + this.type + " ,It only has:" + Object.keys(CDN_Domain[gid].concat).join(','))
        let gurl = `https://${CDN_Domain[gid].domain}${CDN_Domain[gid].concat[this.type]}`
        for (var reg_item in this.var) gurl = gurl.replace(`{{${reg_item}}}`, this.var[reg_item])
        return new CDNObject(gurl)
    }
    this.get_all_mirrors = function () {
        const mirrors = []
        for (var item in CDN_Domain) {
            if (!!CDN_Domain[item].concat[this.type]) {
                mirrors.push({
                    id: item,
                    domain: CDN_Domain[item].domain,
                    weight: CDN_Domain[item].weight
                })
            }
        }
        return mirrors
    }
}



addEventListener('fetch', event => {
    try {
        event.respondWith(handleRequest(event.request))
    } catch (e) {
        event.respondWith(new Response("Cyan Acc Err!"))
        return;
    }
})
addEventListener('install', function () {
    self.skipWaiting();
});
addEventListener('activate', function () {
    self.clients.claim();
})
const handleRequest = async (request) => {
    const domain = (new URL(request.url)).host
    if (Blog_Domain.includes(domain)) return BlogRouter(request)
    for (var cdnitem of CDN_Domain) {
        if (request.url.match(new RegExp(cdnitem.match))) return CDNRouter(request)
    }
    return fetch(request)
}
const BlogRouter = async (request) => {
    const url = new URL(request.url)
    const path = url.pathname
    if (path.startsWith('/CyanAcc')) return CyanAccRouter(request)
    return fetch(request)
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
                return new Response('PONG')
            default:
                return new Response('Bad Request', { status: 400 })
        }
    }
    switch (path) {
        case '':
            return Response.redirect('/CyanAcc/')
        case '/':
            return new Response('This Page Was Provided By CyanAcc')
        case '/api':
            return CyanAccAPIRouter(request)
        default:
            return new Response('404 Not Found', { status: 404 })
    }
}
