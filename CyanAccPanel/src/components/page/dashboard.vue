<script setup>
import { ref, watch } from 'vue'
import '@chenyfan/cache-db'
import Notyf from '../../utils/notyf.js'
import CyanAccAPI from '../../utils/CyanAccAPI.js'
const PrettyBytes = (bytes) => {
    if (typeof bytes !== 'number') return bytes
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    let i = 0
    while (bytes >= 1024) {
        bytes /= 1024
        i++
    }
    return `${bytes.toFixed(2)} ${units[i]}`
}
//优化时长显示
const PrettyTime = (time) => {
    if (typeof time !== 'number') return time
    const units = ['毫秒', '秒', '分钟', '小时', '天', '年']
    const hop = [1000, 60, 60, 24, 365]
    let i = 0
    while (time >= hop[i]) {
        time /= hop[i]
        i++
    }
    return `${Math.round(time)} ${units[i]}`
}
const CacheSize = ref("缓存大小尚在获取...")
const PersistentTasks = ref([])
const PersistentTasksNumber = ref(0)
watch(PersistentTasks, (val) => {
    PersistentTasksNumber.value = val.length
})
const BlogVersion = ref("1970/1/1 08:00:00")
const InitTime = ref(0)


const fetchCacheSize = async (precise) => {
    const size = await CyanAccAPI('GET_CACHE_SIZE', { precise })
    CacheSize.value = PrettyBytes(size)
}
const GetPersistentTasks = async () => {
    const tasklist = await CyanAccAPI('DUMP_VAR_TASKLIST')
    PersistentTasks.value = tasklist
}
const fetchBlogVersion = async () => {
    const db = new CacheDB('CyanAcc', "CyanAccDB")
    const blogMirror = JSON.parse(await db.read('Blog_Fetch_Config')).mirrors
    for (const mirror of blogMirror) {
        if (mirror.type === "npm") {
            BlogVersion.value = new Date(Number(mirror.var.PACKAGE_VERSION.split("-")[1])).toLocaleString()
        }
    }
}
const GetInitTime = async () => {
    const time = await CyanAccAPI('GET_INIT_TIME')
    InitTime.value = time
}
!!(async () => {
    await fetchCacheSize(false)
    await GetPersistentTasks()
    setInterval(async () => {
        await GetPersistentTasks()
    }, 1000 * 5);
    await fetchBlogVersion()
    await GetInitTime()
})()
</script>

<template>
    <div class="row">
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div class="card">
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-8">
                            <div class="numbers">
                                <p class="text-sm mb-0 text-capitalize font-weight-bold">缓存空间占用</p>
                                <h5 class="font-weight-bolder mb-0" @click="fetchCacheSize(true)">
                                    {{ PrettyBytes(CacheSize) }}
                                </h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div class="card">
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-8">
                            <div class="numbers">
                                <p class="text-sm mb-0 text-capitalize font-weight-bold">持久任务数量</p>
                                <h5 class="font-weight-bolder mb-0">
                                    {{ PersistentTasksNumber }}
                                </h5>
                            </div>
                        </div>
                        <div class="col-4 text-end">
                            <div class="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                <i class="ni ni-world text-lg opacity-10" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div class="card">
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-8">
                            <div class="numbers">
                                <p class="text-sm mb-0 text-capitalize font-weight-bold">当前博客版本更新时间</p>
                                <h5 class="font-weight-bolder mb-0">
                                    {{ BlogVersion }}
                                </h5>
                            </div>
                        </div>
                        <div class="col-4 text-end">
                            <div class="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                <i class="ni ni-paper-diploma text-lg opacity-10" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-sm-6">
            <div class="card">
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-8">
                            <div class="numbers">
                                <p class="text-sm mb-0 text-capitalize font-weight-bold">CyanAcc激活时间</p>
                                <h5 class="font-weight-bolder mb-0">
                                    {{ new Date(InitTime).toLocaleString() }}
                                </h5>
                            </div>
                        </div>
                        <div class="col-4 text-end">
                            <div class="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                <i class="ni ni-cart text-lg opacity-10" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mt-4">
        <div class="col-lg-12 mb-lg-0 mb-4">
            <div class="card ">
                <div class="card-header pb-0 p-3">
                    <div class="d-flex justify-content-between">
                        <h6 class="mb-2">持久任务表</h6>
                    </div>
                </div>
                <div class="table-responsive w-full">
                    <table class="table align-items-center w-full">
                        <tbody>
                            <tr>
                                <td>
                                    <div class="text-center">
                                        <p class="text-xs font-weight-bold mb-2">简介</p>
                                    </div>
                                </td>
                                <td>
                                    <div class="text-center">
                                        <p class="text-xs font-weight-bold mb-2">循环周期</p>
                                    </div>
                                </td>
                                <td class="align-middle text-sm">
                                    <div class="col text-center">
                                        <p class="text-xs font-weight-bold mb-2">上一次执行</p>
                                    </div>
                                </td>
                                <td class="align-middle text-sm">
                                    <div class="col text-center">
                                        <p class="text-xs font-weight-bold mb-2">启用状态</p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-for="task in PersistentTasks">
                                <td>
                                    <div class="text-center">
                                        <h6 class="text-sm mb-2">{{ task.description }}</h6>
                                    </div>
                                </td>
                                <td>
                                    <div class="text-center">
                                        <h6 class="text-sm mb-2">{{ PrettyTime(task.interval) }}</h6>
                                    </div>
                                </td>
                                <td class="align-middle text-sm">
                                    <div class="col text-center">
                                        <h6 class="text-sm mb-2">{{ new Date(task.lastrun.time).toLocaleString() }}</h6>
                                    </div>
                                </td>
                                <td class="align-middle text-sm">
                                    <div class="col text-center">
                                        <h6 class="text-sm mb-2" :class="task.enable ? 'text-success' : 'text-danger'">{{
                                            task.enable ? '启用' : '禁用' }}</h6>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- <div class="col-lg-4 mb-lg-0 mb-4">
            <div class="card">
                <div class="card-body p-3">
                    <div class="row">
                        
                    </div>
                </div>
            </div>
        </div> -->
    </div>
</template>


<style scoped></style>
