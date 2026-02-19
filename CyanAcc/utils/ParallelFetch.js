const ThisDomain = new URL(self.location.href).host
export default async (reqs, Config) => {
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
                return fetch(req, {
                    signal: controller.signal,
                    mode: new URL(req.url).host === ThisDomain ? "same-origin" : "cors",
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