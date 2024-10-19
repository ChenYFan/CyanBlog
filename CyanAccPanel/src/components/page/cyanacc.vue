<script setup>
import { ref } from 'vue'
import '@chenyfan/cache-db'
import Notyf from '../../utils/notyf.js'
import reinit from '../../utils/reinit';
const CyanAccSetting = ref({
    enable: true,
    reinit: false,
    PersistentTasks: {
        enable: true,
        interval: 1000
    },
    AutoClear: {
        enable: true,
        interval: 1000 * 60 * 2
    }
})
const db = new CacheDB('CyanAcc', "CyanAccDB")
const dbName = 'CyanAcc_Config'
const saveSetting = async () => {
    await db.write(dbName, JSON.stringify(CyanAccSetting.value))
    !!(await reinit()) ? Notyf.success('设置已保存并应用') : Notyf.info('设置已保存，但尚未应用')
};

!(async () => {
    const data = JSON.parse((await db.read(dbName)) || '{}')
    if (Object.keys(data).length !== 0) CyanAccSetting.value = data
    else await db.write(dbName, JSON.stringify(CyanAccSetting.value))
})();

</script>

<template>
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-full px-3">
                <div
                    class="relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border">
                    <div class="p-4 pb-0 mb-0 bg-white border-b-0 rounded-t-2xl">
                        <h6 class="mb-0">CyanAcc总引擎设置</h6>
                    </div>
                    <div class="flex-auto p-4">
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input class="check-btn" type="checkbox" v-model="CyanAccSetting.enable" />
                                    <label class="label-text">CyanAcc总开关</label>
                                </div>
                            </li>
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input class="check-btn" type="checkbox" v-model="CyanAccSetting.reinit"
                                        :disabled="!CyanAccSetting.enable" />
                                    <label class="label-text">在对CyanAcc设置进行更改后，立即应用</label>
                                </div>
                            </li>
                        </ul>
                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">持久化任务</h6>
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input class="check-btn" type="checkbox" v-model="CyanAccSetting.PersistentTasks.enable"
                                        :disabled="!CyanAccSetting.enable" />
                                    <label class="label-text">启用CyanAcc PersistentTasks</label>
                                </div>
                            </li>
                            <label class="label-text">PersistentTasks激活间隔<span>
                                    {{ CyanAccSetting.PersistentTasks.interval/1000 }}秒</span></label>
                            <input type="range" min="1000" max="5000" class="slider w-full" step="1000"
                                :disabled="!(CyanAccSetting.enable && CyanAccSetting.PersistentTasks.enable)"
                                v-model.number="CyanAccSetting.PersistentTasks.interval" />
                        </ul>
                        <br />

                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">自动清除过期缓存</h6>
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input class="check-btn" type="checkbox" v-model="CyanAccSetting.AutoClear.enable"
                                        :disabled="!(CyanAccSetting.enable && CyanAccSetting.PersistentTasks.enable)" />
                                    <label class="label-text">启用CyanAcc AutoClear</label>
                                </div>
                            </li>
                            <label class="label-text">AutoClear间隔时间<span>
                                    {{ CyanAccSetting.AutoClear.interval/1000 }}秒</span></label>
                            <input type="range" :min="1000 * 30" :max="1000 * 120" step="1000" class="slider w-full"
                                :disabled="!(CyanAccSetting.enable && CyanAccSetting.PersistentTasks.enable && CyanAccSetting.AutoClear.enable)"
                                v-model.number="CyanAccSetting.AutoClear.interval" />
                        </ul>
                        <br />
                        <button type="button" class="apply-btn" @click="saveSetting()">保存</button>
                        <p style="font-size:11px">Tips:<br />
                            1.请不要随意关闭CyanAcc引擎，这会导致你无法再直接进入面板！<br />
                            2.持久化任务用于定时执行任务，随ServiceWorker生命周期运行。当你的浏览器关闭所有本站网页后，持久化任务会在1-2分钟内随SW暂停而冻结。当重新激活时，持久化监护会检查任务最后一次运行时间来决定是否运行一次。<br />
                            3.AutoClear依赖持久化运行，默认以一个持久化任务存在，会清除所有超过L2缓存时间的缓存。<br />
                        </p>
                    </div>


                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
