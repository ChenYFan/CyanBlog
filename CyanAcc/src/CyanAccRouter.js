import BlogRouter from './BlogRouter.js'
import PreducePath from '../utils/PreducePath.js'
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
            case 'TEMP_DISABLE':
                self.self_disable = true
                return new Response(JSON.stringify({ status: "OK", data: "CyanAcc Will Be Temporarily Disabled Until Next Restart" }))
            case 'DUMP_VAR_TASKLIST':
                return new Response(JSON.stringify({ status: "OK", data: self.PersistentTasksInstance.pool }))
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

export default CyanAccRouter