<script setup>
import { ref } from 'vue'
import CacheDB from '@chenyfan/cache-db'
import Notyf from '../../utils/notyf.js'
import reinit from '../../utils/reinit.js'
const db = new CacheDB('CyanAcc', "CyanAccDB")
const dbName = 'DarkModeSetting'
const DarkModeSetting = ref({
    auto: true,
    auto_mode: 'auto',
    force_mode: 'light'
})
const saveSetting = async () => {
    await db.write(dbName, JSON.stringify(DarkModeSetting.value))
    !!(await reinit()) ? Notyf.success('设置已保存并应用') : Notyf.info('设置已保存，但尚未应用')
}
!(async () => {
    const data = JSON.parse((await db.read(dbName)) || '{}')
    if (Object.keys(data).length !== 0) DarkModeSetting.value = data
    else await db.write(dbName, JSON.stringify(DarkModeSetting.value))
})()
</script>

<template>
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-full px-3">
                <div
                    class="relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border">
                    <div class="p-4 pb-0 mb-0 bg-white border-b-0 rounded-t-2xl">
                        <h6 class="mb-0">暗色模式 / DarkMode</h6>
                    </div>
                    <div class="flex-auto p-4">
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input
                                        class="mt-0.54 rounded-10 duration-250 ease-soft-in-out after:rounded-circle after:shadow-soft-2xl after:duration-250 checked:after:translate-x-5.25 h-5 relative float-left ml-auto w-10 cursor-pointer appearance-none border border-solid border-gray-200 bg-slate-800/10 bg-none bg-contain bg-left bg-no-repeat align-top transition-all after:absolute after:top-px after:h-4 after:w-4 after:translate-x-px after:bg-white after:content-[''] checked:border-slate-800/95 checked:bg-slate-800/95 checked:bg-none checked:bg-right"
                                        type="checkbox" v-model="DarkModeSetting.auto" />
                                    <label class="label-text">自动选择暗色/亮色模式</label>
                                </div>
                            </li>
                            <select :disabled="!DarkModeSetting.auto" v-model="DarkModeSetting.auto_mode"
                                class="w-full px-3 py-2 mt-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="auto">根据浏览器/系统暗色自动选择</option>
                                <option value="time">根据当地时间自动选择（默认为当地时间18点-次日6点为暗色）</option>
                            </select>
                        </ul>
                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">手动选择</h6>
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <select :disabled="DarkModeSetting.auto" v-model="DarkModeSetting.force_mode"
                                class="w-full px-3 py-2 mt-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="dark">暗色</option>
                                <option value="light">亮色</option>
                            </select>
                        </ul>
                        <br />
                        <button @click="saveSetting()" type="button" class="apply-btn">保存</button>

                    </div>


                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
