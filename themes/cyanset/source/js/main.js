(async () => {
    var navEl = document.getElementById('theme-nav');
    navEl.addEventListener('click', (e) => {
        if (window.innerWidth <= 720) {
            if (navEl.classList.contains('open')) {
                navEl.style.height = ''
            } else {
                navEl.style.height = 48 + document.querySelector('#theme-nav .nav-items').clientHeight + 'px'
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
            navEl.style.height = 48 + document.querySelector('#theme-nav .nav-items').clientHeight + 'px'
        }
        if (window.innerWidth > 720) {
            if (navEl.classList.contains('open')) {
                navEl.style.height = ''
                navEl.classList.remove('open')
            }
        }
    })

    window.db = new CacheDB('CyanAcc', "CyanAccDB")
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

    const currentSetting = await db.read("DarkModeSetting")
        .then(async (res) => {
            if (!res) {
                await db.write("DarkModeSetting", JSON.stringify(ColorDefault))
                return ColorDefault
            }
            return JSON.parse(res)
        })
    updateCurrent(currentSetting)

    // window.ColorScheme = new class {
    //     constructor() {
    //         window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
    //             this.updateCurrent(
    //                 await db.read("DarkModeSetting")
    //                     .then(async (res) => {
    //                         if (!res) {
    //                             await db.write("DarkModeSetting", JSON.stringify(ColorDefault))
    //                             return ColorDefault
    //                         }
    //                         return JSON.parse(res)
    //                     })
    //             )
    //         })
    //     }
    //     get() {
    //         const stored = Cookies.get('color-scheme', 'auto')
    //         this.updateCurrent(stored)
    //         return stored
    //     }
    //     getReal() {
    //         return document.body.getAttribute('data-current-color-scheme')
    //     }
    //     set(value) {
    //         bodyEl.setAttribute('data-color-scheme', value)
    //         Cookies.set('color-scheme', value)
    //         this.updateCurrent(value)
    //         return value
    //     }

    // }

    // if (document.getElementById('theme-color-scheme-toggle')) {
    //     var bodyEl = document.body
    //     var themeColorSchemeToggleEl = document.getElementById('theme-color-scheme-toggle')
    //     var options = themeColorSchemeToggleEl.getElementsByTagName('input')

    //     if (ColorScheme.get()) {
    //         bodyEl.setAttribute('data-color-scheme', ColorScheme.get())
    //     }

    //     for (const option of options) {
    //         if (option.value == bodyEl.getAttribute('data-color-scheme')) {
    //             option.checked = true
    //         }
    //         option.addEventListener('change', (ev) => {
    //             var value = ev.target.value
    //             ColorScheme.set(value)
    //             for (const o of options) {
    //                 if (o.value != value) {
    //                     o.checked = false
    //                 }
    //             }
    //         })
    //     }

    // }

    if (document.body.attributes['data-rainbow-banner']) {
        var shown = false
        switch (document.body.attributes['data-rainbow-banner-shown'].value) {
            case 'always':
                shown = true
                break;
            case 'auto':
                shown = new Date().getMonth() + 1 == parseInt(document.body.attributes['data-rainbow-banner-month'].value, 10)
                break;
            default:
                break;
        }
        if (shown) {
            var banner = document.createElement('div')

            banner.style.setProperty('--gradient', `linear-gradient(90deg, ${document.body.attributes['data-rainbow-banner-colors'].value})`)
            banner.classList.add('rainbow-banner')

            navEl.after(banner)
        }
    }

    if (document.body.attributes['data-toc']) {
        const content = document.getElementsByClassName('content')[0]
        const maxDepth = document.body.attributes['data-toc-max-depth'].value

        var headingSelector = ''
        for (var i = 1; i <= maxDepth; i++) {
            headingSelector += 'h' + i + ','
        }
        headingSelector = headingSelector.slice(0, -1)
        const headings = content.querySelectorAll(headingSelector)
        var source = []
        headings.forEach((heading) => {
            const level = parseInt(heading.tagName[1])
            const Text = "&nbsp;".repeat((level - 1) * 2) + heading.innerText
            console.log(Text)
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
                    return "YAML"
                default:
                    return GetLang
            }

        })()}</span>`
        hlel.innerHTML = btn + hlel.innerHTML
    };
    window.onresize = function () {
        SetCoverImageSize()
    }
    const SetCoverImageSize = () => {
        setTimeout(() => {
            for (var ele of document.getElementsByClassName("cover-img")) {
                ele.style["max-width"] = ele.parentElement.offsetWidth + "px"
                ele.style["max-height"] = ele.parentElement.offsetHeight + "px"
                ele.style["margin-bottom"] = ele.parentElement.style["margin-bottom"] + "px"
                ele.style["margin-right"] = ele.parentElement.style["margin-right"] + "px"
            }
        }, 500);
    }
    SetCoverImageSize()
})()

window.loadJS = async (url) => {
    return new Promise((resolve, reject) => {
        var script = document.createElement('script')
        script.src = url
        script.onload = () => {
            resolve()
        }
        script.onerror = () => {
            reject()
        }
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

        link.onload = () => {
            resolve()
        }
        link.onerror = () => {
            reject()
        }
    })
}

setTimeout(() => {
    loadCSS("https://registry.npmmirror.com/lxgw-wenkai-screen-webfont/1.1.0/files/style.css")
}, 0);

//节流
function throttle(fn, wait) {
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

function query(selector) {
    return Array.from(document.querySelectorAll(selector));
}

window.lazylistener = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            var img = entry.target;
            img.srcset = img.getAttribute('data-srcset');
            img.className += ' loaded'
            lazylistener.unobserve(img);
        }
    });
});

const ObserverImage = () => {
    query('img.lazy').forEach(function (item) {
        if (item.classList.contains('loaded')) return;
        lazylistener.observe(item);
    });
}

setInterval(() => {
    ObserverImage()
}, 3000);
window.addEventListener('scroll', throttle(ObserverImage, 200))
ObserverImage()
