
const BlogRouter = async (request) => {
    const PreducePath = (urlObj) => {
        let pathname = urlObj.pathname || '/'
        pathname = pathname
            .replace(/\/$/, '/index.html')
            .replace(/^\//, '')
        return pathname
    }
    
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
export default BlogRouter