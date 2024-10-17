import ParallelFetch from "./ParallelFetch.js"
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
                FetchPair = await ParallelFetch(fetchList.map(item => {
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
export default AssetsFetchWithCache