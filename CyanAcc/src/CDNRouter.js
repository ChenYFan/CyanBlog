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

export default CDNRouter