(async () => {
    window.$ = (selector) => document.querySelector(selector)
    window.$_ = (selector) => document.getElementById(selector)
    window.$$ = (selector) => document.querySelectorAll(selector)
    window.loadJS = async (url) => {
        return new Promise((resolve, reject) => {
            var script = document.createElement('script')
            script.src = url
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
        })
    }
    window.loadCSS = async (url) => {
        return new Promise((resolve, reject) => {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = url;
            document.getElementsByTagName('HEAD')[0].appendChild(link);
            link.onload = resolve
            link.onerror = reject
        })
    }
    window.notyf = new Notyf({
        duration: 3000,
        position: {
            x: 'right',
            y: 'bottom'
        },
        ripple: true,
        dismissible: true,
        types: [
            {
                type: 'warn',
                background: 'orange',
                icon: false
            },
            {
                type: 'info',
                background: 'blue',
                icon: false
            }
        ]
    });
    notyf.info = (message) => notyf.open({ type: 'info', message })
    notyf.warn = (message) => notyf.open({ type: 'warn', message })
    window.funcThrottle = (fn, wait) => {
        var prev = Date.now();
        return function () {
            var context = this;
            var args = arguments;
            var now = Date.now();
            if (now - prev >= wait) {
                fn.apply(context, args);
                prev = Date.now();
            }
        }
    }
    window.db = new CacheDB('CyanAcc', "CyanAccDB", { auto: 1 })

    setTimeout(() => {
        loadCSS("https://registry.npmmirror.com/@chenyfan/npm-autosync/0.0.0-1729174143/files/data/npm/lxgw-wenkai-screen-webfont/1.1.0/files/style.css")
    }, 0);


    //nav fix
    var navEl = $_('theme-nav');
    navEl.addEventListener('click', (e) => {
        if (window.innerWidth <= 720) {
            if (navEl.classList.contains('open')) {
                navEl.style.height = ''
            } else {
                navEl.style.height = 48 + $('#theme-nav .nav-items').clientHeight + 'px'
            }
            navEl.classList.toggle('open')
        } else {
            if (navEl.classList.contains('open')) {
                navEl.style.height = ''
                navEl.classList.remove('open')
            }
        }
    })
    window.addEventListener('resize', (e) => {
        if (navEl.classList.contains('open')) {
            navEl.style.height = 48 + $('#theme-nav .nav-items').clientHeight + 'px'
        }
        if (window.innerWidth > 720) {
            if (navEl.classList.contains('open')) {
                navEl.style.height = ''
                navEl.classList.remove('open')
            }
        }
    })


    !!(async () => {
        //update Color
        const ColorDefault = {
            "auto": true,
            "auto_mode": "auto",
            "force_mode": "light"
        }

        const updateCurrent = (value) => {
            var current = 'light'
            if (value.auto) {
                if (value.auto_mode == 'time') {
                    current = new Date().getHours() >= 18 || new Date().getHours() <= 6 ? 'dark' : 'light'
                }
                else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    current = 'dark'
                }
            } else {
                current = value.force_mode
            }
            document.body.setAttribute('data-current-color-scheme', current)
            document.body.setAttribute('data-color-scheme', current)
            window.darkMode = current === "dark"
        }

        const currentSetting = await db.read("DarkModeSetting", { default: ColorDefault, type: "json" })
        updateCurrent(currentSetting)

    })()

    !!(async => {
        //toc update
        if (document.body.attributes['data-toc']) {
            const content = document.getElementsByClassName('content')[0]
            const maxDepth = document.body.attributes['data-toc-max-depth'].value
            var headingSelector = ''
            for (var i = 1; i <= maxDepth; i++) headingSelector += 'h' + i + ','
            headingSelector = headingSelector.slice(0, -1)
            const headings = content.querySelectorAll(headingSelector)
            var source = []
            headings.forEach((heading) => {
                const level = parseInt(heading.tagName[1])
                const Text = "&nbsp;&nbsp;".repeat((level - 1) * 2) + (level <= 1 ? "" : "↳") + heading.innerText
                source.push({
                    html: Text,
                    href: heading.getElementsByClassName('headerlink')[0].attributes['href'].value
                })
            })

            const toc = document.createElement('div')
            toc.classList.add('toc')
            for (const i in source) {
                const item = document.createElement('p')
                const link = document.createElement('a')
                link.href = source[i].href
                link.innerHTML = source[i].html
                item.appendChild(link)
                toc.appendChild(item)
            }

            if (toc.children.length != 0) {
                document.getElementsByClassName('post')[0].getElementsByClassName('divider')[0].after(toc)
                const divider = document.createElement('div')
                divider.classList.add('divider')
                toc.after(divider)
            }
        }
    })()



    for (let hlel of document.getElementsByClassName("highlight")) {
        const lang = hlel.classList[1]
        const btn = `<span class="code-lang">${(() => {
            const GetLang = lang.toUpperCase()
            switch (GetLang) {
                case "JS":
                    return "JAVASCRIPT"
                case "TS":
                    return "TYPESCRIPT"
                case "YML":
                    return "YAML",
                case 'SH':
                    return "SHELL"
                default:
                    return GetLang
            }

        })()}</span>`
        hlel.innerHTML = btn + hlel.innerHTML
    };
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault() //阻止Safari手动缩放
    })








    window.lazylistener = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                img.srcset = img.getAttribute('data-srcset');
                lazylistener.unobserve(img);
                img.onload = function () {
                    img.className += ' loaded'
                }
            }
        });
    });

    const ObserverImage = () => {
        Array.from($$('img.lazy')).forEach(function (item) {
            if (item.classList.contains('loaded')) return;
            lazylistener.observe(item);
        });
    }

    setInterval(ObserverImage, 3000);
    ObserverImage()
    window.addEventListener('scroll', window.funcThrottle(ObserverImage, 200))






    // if (!!$_("Comments")) {
    if ($_('Comments')) {
        const CommentSetting = await db.read("CommentSetting", {
            default: {
                enable: true,
                delay: 5
            },
            type: "json"
        })
        if (CommentSetting.enable) {
            $_("comment_notice").innerText = "Comment Will Load After " + CommentSetting.delay + "s"
            setTimeout(() => {
                const wait_comment_load = setInterval(async () => {
                    if (isElementVisible($_("Comments"))) {
                        clearInterval(wait_comment_load)
                        $_("comment_notice").innerText = "Loading Comment Script..."
                        await loadJS("https://registry.npmmirror.com/artalk/2.9.1/files/dist/Artalk.js")
                        $_("comment_notice").innerText = "Loading Comment Style..."
                        await loadCSS("https://registry.npmmirror.com/artalk/2.9.1/files/dist/Artalk.css")
                        $_("comment_notice").innerText = "Loading Comment Frame..."
                        window.artalk = Artalk.init({
                            el: '#Comments',
                            pageKey: window.location.pathname,
                            pageTitle: "",
                            server: 'https://artalk.eurekac.cn',
                            site: 'CyanFalseの幻想乡♂'
                        })
                        artalk.setDarkMode(window.darkMode)
                    }
                }, 1000)
            }, CommentSetting.delay * 1000)
        } else $_("comment_notice").innerText = "Comment Disabled by Your Config"
        const isElementVisible = (el) => {
            const rect = el.getBoundingClientRect()
            const vWidth = window.innerWidth || document.documentElement.clientWidth
            const vHeight = window.innerHeight || document.documentElement.clientHeight
            if (
                rect.right < 0 ||
                rect.bottom < 0 ||
                rect.left > vWidth ||
                rect.top > vHeight
            ) {
                return false
            }

            return true
        }
    }

})()





    // loadJS("https://cdn.eurekac.cn/npm/vconsole/3.15.1/files/dist/vconsole.min.js").then(() => {
    //     var vConsole = new window.VConsole();
    //     setTimeout(() => {
    //         Array.from(document.getElementsByClassName("highlight")).forEach((ele) => {       })
    //     }, 1000);
    // })





    ; (async () => {

        if (!!$_('map')) {
            window.loadPageMap = (dark) => {
                $_('map').id = 'map-predelete'
                let newMap = document.createElement('canvas')
                newMap.id = 'map'
                $_('map-predelete').insertAdjacentElement('afterend', newMap)
                $_('map-predelete').remove()
                let initColor = dark ? '255,255,255' : '0,0,0'
                pagemap($_('map'), {
                    viewport: null,
                    styles: {
                        'header,footer,section,article': 'rgba(' + initColor + ',0.08)',
                        'h1': 'rgba(' + initColor + ',0.10)',
                        'h2,h3,h4': 'rgba(' + initColor + ',0.08)',
                        'pre': 'rgba(' + initColor + ',0.05)'
                    },
                    back: 'rgba(' + initColor + ',0.02)',
                    view: 'rgba(' + initColor + ',0.05)',
                    drag: 'rgba(' + initColor + ',0.10)',
                    interval: null
                });
                $_('map').addEventListener('mouseover', () => {
                    $_('map').classList.remove('fadeout')
                    $_('map').classList.add('fadein')
                });
                $_('map').addEventListener('mouseout', () => {
                    $_('map').classList.remove('fadein')
                    $_('map').classList.add('fadeout')
                });
                let map = $_('map')
                let mapTimeout = null
                document.addEventListener('scroll', () => {
                    map.classList.remove('fadeout')
                    map.classList.add('fadein')
                    if (mapTimeout) clearTimeout(mapTimeout)
                    mapTimeout = setTimeout(() => {
                        map.classList.remove('fadein')
                        map.classList.add('fadeout')
                    }, 1000)
                })
            }
            loadPageMap(window.darkMode, true)
        }

        window.db = new CacheDB('CyanAcc', "CyanAccDB")
        if (await db.read('needInstall', { default: 'false' }) === 'never') {
            console.log('CyanAcc已禁用')
            return;
        }
        if ('serviceWorker' in navigator) {
            if (new Date().getTime() > Number(await db.read('install_time', { default: 0, type: 'number' })) + 1000 * 60 * 60) {
                const oldBlogVersion = await db.read('Blog_Version', {
                    default: 0,
                    type: 'number'
                })
                const newestBlogVersion = Number(((await fetch('/package.json?__t=' + new Date().getTime(), {
                    headers: { 'no-CyanAcc': 'true' }
                }).then(res => res.json()).then(res => res.version)).split('-'))[1])
                if (oldBlogVersion < newestBlogVersion) {
                    if (oldBlogVersion !== 0) notyf.info(`${new Date(newestBlogVersion).toLocaleString('zh-CN', { month: 'long', day: 'numeric' })}博客更新已发布，</br>正在更新...`)
                    await db.write('Blog_Version', newestBlogVersion)
                    await db.write('install_time', new Date().getTime())
                    await db.write('needInstall', 'true')
                }
            }

            if (await db.read('needInstall', { default: 'false' }) === 'true') {
                const installedCyanAcc = await navigator.serviceWorker.getRegistrations().then(regs => regs.filter(reg => reg.active && reg.active.scriptURL.includes('CyanAcc.js')))
                if (installedCyanAcc.length > 0) {
                    await installedCyanAcc[0].update()
                    notyf.success('CyanAcc已更新！')
                    await db.write('install_time', new Date().getTime())
                    await db.write('needInstall', 'false')
                    return;
                } else {
                    navigator.serviceWorker.register("/CyanAcc.js")
                        .then(async reg => {
                            let error = 0
                            const CyanAcc_Checker = setInterval(() => {
                                //不适用navigator.serviceWorker.getRegistrations，据测试这个active状态不一定获取得到
                                fetch('/CyanAcc/api', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        action: 'PING'
                                    })
                                })
                                    .then(res => res.json())
                                    .then(async res => {
                                        if (res.data === "PONG") {
                                            notyf.success('CyanAcc安装成功！')
                                            clearInterval(CyanAcc_Checker)
                                            await db.write('needInstall', 'false')
                                        }
                                    })
                                    .catch(err => {
                                        console.log(`CyanAcc检查失败，正在重试第${error}次`)
                                        error++
                                        if (error > 10) {
                                            notyf.error({
                                                message: `CyanAcc安装后无成功响应！将不会再尝试安装！</br>正在卸载已安装的CyanAcc...</br>详细信息请查看控制台`,
                                                duration: 10000
                                            })
                                            console.error(err)
                                            clearInterval(CyanAcc_Checker)
                                            db.write('needInstall', 'never')
                                            reg.unregister()
                                        }
                                    })
                            }, 1000);
                        }).catch(async err => {
                            notyf.error({
                                message: `CyanAcc安装失败！</br>将不会再尝试启动CyanAcc</br>请点击右上角设置手动安装</br>详细信息请查看控制台`,
                                duration: 10000
                            })
                            console.error(err)
                            await db.write('needInstall', 'never')
                        })
                }

            }


        } else {
            if (location.protocol !== 'https:') notyf.error('请使用HTTPS协议以启用CyanAcc')
            else {
                notyf.error('您的浏览器不支持或被广告插件禁用ServiceWorker</br>已直接禁用CyanAcc')
                await db.write('needInstall', 'never')
            }
        }
    })();