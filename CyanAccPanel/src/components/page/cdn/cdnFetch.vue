<script setup>
import { ref, reactive, watch } from 'vue'
import Monaco from '../../../utils/CodeEditor.vue'
 import  '@chenyfan/cache-db'
import Notyf from '../../../utils/notyf.js'
import reinit from '../../../utils/reinit.js'
const db = new CacheDB('CyanAcc', "CyanAccDB")
const dbName = 'CDN_Fetch_Config'
const EditMode = ref("visual") 
const CDNSetting = ref({
})
const saveSetting = async () => {
    await db.write(dbName, JSON.stringify(CDNSetting.value))
    !!(await reinit()) ? Notyf.success('设置已保存并应用') : Notyf.info('设置已保存，但尚未应用')
}
const Content = ref("");

watch(CDNSetting, (newVal, oldVal) => {
    Content.value = JSON.stringify(newVal, null, 4)
}, {
    deep: true
});

!(async () => {
    const data = JSON.parse((await db.read(dbName)) || '{}')
    if (Object.keys(data).length !== 0) { CDNSetting.value = data; Content.value = JSON.stringify(CDNSetting.value, null, 4) }
    else await db.write(dbName, JSON.stringify(CDNSetting.value))
})();


const options = {
    language: 'json',
    code: Content.value,
}
const editorp = reactive({
    el: 'monaco',
    options: options
});
const handleContentUpdate = (value) => {
    Content.value = value
    try { JSON.parse(Content.value) } catch (e) { console.log(); return; }
    CDNSetting.value = JSON.parse(Content.value)
}

</script>

<template v-if="typeof CDNSetting.enable !== 'undefined'">
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-full px-3">
                <div
                    class="relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border">
                    <div class="p-4 pb-0 mb-0 bg-white border-b-0 rounded-t-2xl">
                        <h6 class="mb-0">CDN获取配置 / CDN Fetch Config</h6>
                    </div>
                    <div class="flex-auto p-4">
                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">选择编辑模式</h6>
                        <div class="mb-4">
                            <select class="select-form" v-model="EditMode">
                                <option value="visual">可视化编辑</option>
                                <option value="code">JSON数据库编辑</option>
                            </select>

                        </div>
                        <div class="flex-auto p-4">
                            <div class="monacoEditor" v-show="EditMode === 'code'">
                                <Monaco :option="editorp" :value="Content" @update-content="handleContentUpdate" />
                            </div>
                            <div v-show="EditMode === 'visual'">
                                <div class="flex flex-col pl-0 mb-0 rounded-lg">
                                    <div class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                        <div class="min-h-6 mb-0.5 block pl-0">
                                            <input class="check-btn" type="checkbox" v-model="CDNSetting.enable" />
                                            <label class="label-text">启用“CDN本地智能调度功能”</label>
                                        </div>
                                    </div>
                                    <h6 class="mt-3 font-bold leading-tight uppercase text-xs text-slate-500">CDN缓存设置
                                    </h6>
                                    <div class="relative text-inherit">
                                        <div class="min-h-6 mb-0.5 block pl-0">
                                            <input class="check-btn" type="checkbox" :disabled="!CDNSetting.enable"
                                                v-model="CDNSetting.cache" />
                                            <label class="label-text">启用“CDN缓存功能”</label>
                                        </div>
                                    </div>
                                    <h6 class="mt-2 font-bold leading-tight uppercase text-xs text-slate-500">
                                        一级缓存时长（毫秒）
                                    </h6>
                                    <input type="text" class="select-form mt-0" placeholder="一级缓存时长"
                                        :disabled="!(CDNSetting.enable && CDNSetting.cache)"
                                        v-model.number="CDNSetting.cacheL1" />
                                    <h6 class="mt-2 font-bold leading-tight uppercase text-xs text-slate-500">
                                        二级缓存时长（毫秒）
                                    </h6>
                                    <input type="text" class="select-form mt-0" placeholder="二级缓存时长"
                                        :disabled="!(CDNSetting.enable && CDNSetting.cache)"
                                        v-model.number="CDNSetting.cacheL2" />

                                    <h6 class="mt-5 font-bold leading-tight uppercase text-xs text-slate-500">CDN Fetch
                                        设置</h6>
                                    <div class="relative text-inherit">
                                        <div class="min-h-6 mb-0.5 block pl-0">
                                            <input class="check-btn" type="checkbox" :disabled="!CDNSetting.enable"
                                                v-model="CDNSetting.parallel" />
                                            <label class="label-text">启用“智能多线程Fetch引擎”</label>
                                        </div>
                                    </div>
                                    <div class="relative text-inherit">
                                        <div class="min-h-6 mb-0.5 block pl-0">
                                            <input class="check-btn" type="checkbox"
                                                :disabled="!(CDNSetting.enable && CDNSetting.parallel)"
                                                v-model="CDNSetting.origin" />
                                            <label class="label-text">在多线程请求时允许将原请求作为附加源加入</label>
                                        </div>
                                    </div>
                                    <div class="relative text-inherit">
                                        <div class="min-h-6 mb-0.5 block pl-0">
                                            <input class="check-btn" type="checkbox"
                                                :disabled="!(CDNSetting.enable && CDNSetting.parallel)"
                                                v-model="CDNSetting.ignore_search" />
                                            <label class="label-text">屏蔽Search字符串以提升缓存命中率</label>
                                        </div>
                                    </div>

                                    <h6 class="mt-3 font-bold leading-tight uppercase text-xs text-slate-500">多线程请求设置
                                    </h6>
                                    <ul class="flex flex-col pl-0">
                                        <label class="label-text ml-0">Parallel并发引擎线程数：<span>
                                                {{ CDNSetting.threads }}个</span></label>
                                        <input type="range" min="2" max="5" class="slider w-full"
                                            :disabled="!(CDNSetting.enable && CDNSetting.parallel)"
                                            v-model.number="CDNSetting.threads" />
                                    </ul>
                                    <h6 class="mt-2 font-bold leading-tight uppercase text-xs text-slate-500">
                                        请求一级超时时长（毫秒）
                                    </h6>
                                    <input type="text" class="select-form mt-0" placeholder="请求一级超时时长"
                                        :disabled="!(CDNSetting.enable && CDNSetting.parallel)"
                                        v-model.number="CDNSetting.timeoutL1" />
                                    <h6 class="mt-2 font-bold leading-tight uppercase text-xs text-slate-500">
                                        请求二级超时时长（毫秒）
                                    </h6>
                                    <input type="text" class="select-form mt-0" placeholder="请求二级超时时长"
                                        :disabled="!(CDNSetting.enable && CDNSetting.parallel)"
                                        v-model.number="CDNSetting.timeoutL2" />


                                </div>



                            </div>
                            <button @click="saveSetting()" type="button" class="apply-btn">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
.monacoEditor {
    width: 100%;
    height: 100%;
}
</style>
