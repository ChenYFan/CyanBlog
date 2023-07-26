//Global Variable
const this_Domain = new URL(self.location.href).hostname


//Choose import the core instead of importScript to void extra http request
//CacheDB
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
//CacheDB End

//Muulti Thread Fecth
const parallel_fetch = async (reqs) => {
    return new Promise((resolve, reject) => {
        const abortEvent = new Event("abortOtherInstance")
        const eventTarget = new EventTarget();
        const error_fallback = setTimeout(() => {
            reject(new Response('504 All GateWays Failed,CyanAcc Returned', { status: 504, statusText: '504 All Gateways Timeout' }))
        }, 5000);
        Promise.any(reqs.map(async req => {
            let controller = new AbortController(), tagged = false;
            eventTarget.addEventListener(abortEvent.type, () => {
                if (!tagged) controller.abort()
            })
            fetch(req, {
                signal: controller.signal,
                mode: new URL(req.url).hostname === this_Domain ? "same-origin" : "cors",
                redirect:  "follow"
            }).then(res => {
                if (res.status===200) {
                    tagged = true;
                    eventTarget.dispatchEvent(abortEvent)
                    clearTimeout(error_fallback)
                    resolve(rebuild.response(res, {}))
                }
            }).catch(err => {
                if (err == 'DOMException: The user aborted a request.') console.log()//To disable the warning:DOMException: The user aborted a request.
            })
        }))
    })
}
//Main Router start


const db = new CacheDB('CyanAcc')
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})
addEventListener('install', function () {
    self.skipWaiting();
});
addEventListener('activate', function () {
    self.clients.claim();
})
const handleRequest = async (request) => {
    const url = new URL(request.url)
    const domain = url.hostname
    if (domain === 'blog.eurekac.cn' ||
        domain === "127.0.0.1"
    ) return BlogRouter(request)
    if ([
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com',
        'cdn.bootcdn.net',
        'unpkg.com',
        'cdn.staticfile.org',
        'lib.baomitu.com',
        'cdn.bootcss.com',
        'npm.elemecdn.com',
        'unpkg.zhimg.com',
        'registry.npmmirror.com'
    ].includes(domain)) return CDNRouter(request)
    return fetch(request)
}

const BlogRouter = async (request) => {
    const url = new URL(request.url)
    const path = url.pathname
    if (path.startsWith('/CyanAcc')) {
        return CyanAccRouter(request)
    }
    return fetch(request)
}

const CDNRouter = async (request) => {
    return fetch(request)
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
