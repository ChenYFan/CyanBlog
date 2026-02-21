export default (urlObj) => {
    let pathname = urlObj.pathname || '/'
    pathname = pathname
        .replace(/\/$/, '/index.html')
        .replace(/^\//, '')
    return pathname
}