export default {
    CDN_Fetch_Config: {
        enable: true,
        onlyBody: false,
        simpleFetch: true,
        parallel: true,
        ignore_search: true,
        threads: 2,
        origin: true,
        timeoutL1: 2000,
        timeoutL2: 5000,
        cache: true,
        cacheL1: 1000 * 60 * 60 * 24 * 7,
        cacheL2: 1000 * 60 * 60 * 24 * 30
    },
    Blog_Fetch_Config: {
        enable: true,
        onlyBody: true,
        simpleFetch: true,
        parallel: true,
        origin: true,
        ignore_search: true,
        domain: [
            "blog.eurekac.cn",
            "localhost:48080"
        ],
        auto_update: {
            enable: false,
            interval: 1000 * 60 * 60 * 4
        },
        mirrors: [
            // {
            //     "type": "npm",
            //     "var": {
            //         "PACKAGE_NAME": "cyanblog",
            //         "PACKAGE_VERSION": "0.0.0-1700125816401",
            //         "PATH": "/"
            //     },
            //     "weight": 5
            // },
            {
                "type": "url",
                "var": {
                    "DOMAIN": "cyan-blog-three.vercel.app",
                    "PATH": "/"
                },
                "weight": -7
            }
        ],
        threads: 2,
        timeoutL1: 2000,
        timeoutL2: 5000,
        cache: true,
        cacheL1: 1000 * 60 ,
        cacheL2: 1000 * 60 * 60
    },
    CDN_Domain: [
        {
            match: "(cdn|fastly)\\.jsdelivr\\.net",
            domain: "cdn.jsdelivr.net",
            concat: {
                "npm": "/npm(/@{{PACKAGE_SCOPE}})?/{{PACKAGE_NAME}}(@{{PACKAGE_VERSION}})?(/{{$FILE_PATH}})?",
                "github": "/gh/{{USER_NAME}}/{{REPO_NAME}}/{{$FILE_PATH}}"
            },
            weight: 0
        },
        {
            match: "cdnjs\\.cloudflare\\.com",
            domain: "cdnjs.cloudflare.com",
            concat: {
                "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{$FILE_PATH}}"
            },
            weight: 0
        },
        {
            match: "cdn\\.bootcdn\\.net",
            domain: "cdn.bootcdn.net",
            concat: {
                "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{$FILE_PATH}}"
            },
            weight: 0
        },
        {
            match: "unpkg\\.com",
            domain: "unpkg.com",
            concat: {
                "npm": "/{{PACKAGE_NAME}}(@{{PACKAGE_VERSION}})?/{{$FILE_PATH}}"
            },
            weight: 1
        },
        {
            match: "cdn\\.staticfile\\.org",
            domain: "cdn.staticfile.org",
            concat: {
                "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{$FILE_PATH}}"
            },
            weight: 0
        },
        {
            match: "registry\\.npmmirror\\.com",
            domain: "cdn.eurekac.cn",
            concat: {
                "npm": "(/@{{PACKAGE_SCOPE}})?/{{PACKAGE_NAME}}(/{{PACKAGE_VERSION}})?/files(/{{$FILE_PATH}})"
            },
            weight: 10
        }
    ],
    CyanAcc_Config: {
        enable: true,
        reinit: true,
        PersistentTasks: {
            enable: true,
            interval: 1000 * 5
        },
        AutoClear: {
            enable: true,
            interval: 1000 * 60
        },
        BlogVersionCheck: {
            enable: true,
            interval: 1000 * 60 * 60
        }
    }
}