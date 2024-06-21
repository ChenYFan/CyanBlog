<script setup>
import { ref, reactive, watch } from 'vue'
import Monaco from '../../../utils/CodeEditor.vue'
import CacheDB from '@chenyfan/cache-db'
import Notyf from '../../../utils/notyf.js'
import EditableTable from '../../../utils/EditableTable.vue'
import reinit from '../../../utils/reinit.js'
const db = new CacheDB('CyanAcc', "CyanAccDB")
const dbName = 'CDN_Domain'
const EditMode = ref("visual")
const CDNDomain = ref([])
const saveSetting = async () => {
    await db.write(dbName, JSON.stringify(CDNDomain.value))
    !!(await reinit()) ? Notyf.success('设置已保存并应用') : Notyf.info('设置已保存，但尚未应用')
}
const Content = ref("");

watch(CDNDomain, (newVal, oldVal) => {
    for (var item in newVal) {
        if (newVal[item].match === "") {
            newVal.splice(item, 1)
        }
    }
    Content.value = JSON.stringify(newVal, null, 4)
}, {
    deep: true
});

!(async () => {
    const data = JSON.parse((await db.read(dbName)) || '{}')
    if (Object.keys(data).length !== 0) { CDNDomain.value = data; Content.value = JSON.stringify(CDNDomain.value, null, 4) }
    else await db.write(dbName, JSON.stringify(CDNDomain.value))
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
    CDNDomain.value = JSON.parse(Content.value)
}
const handleVisualContentUpdate = (value) => {
    CDNDomain.value = value
}

const CDNDomainKeyIntro = {
    "match": {
        "type": "string",
        "description": "匹配规则",
        "width": "20%"
    },
    "domain": {
        "type": "string",
        "description": "CDN域名",
        "width": "25%"
    },
    "concat": {
        "type": "json",
        "description": "拼接规则",
        "width": "50%"
    },
    "weight": {
        "type": "number",
        "description": "权重",
        "width": "5%"
    }
}

const addPlankOne = () => {
    CDNDomain.value.push({
        "match": "(prefix1|prefix2)\\.testdomain\\.com",
        "domain": "",
        "concat": {},
        "weight": 0
    })
}


</script>

<template>
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-full px-3">
                <div
                    class="relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border">
                    <div class="p-4 pb-0 mb-0 bg-white border-b-0 rounded-t-2xl">
                        <h6 class="mb-0">CDN镜像匹配规则 / CDN Domain Match</h6>
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
                                    <EditableTable :data="CDNDomain" :keyintro="CDNDomainKeyIntro"
                                        @update-content="handleVisualContentUpdate" />
                                </div>
                            </div>
                            <button @click="addPlankOne()" white-style-btn
                                class="inline-block w-full px-4 py-3 mb-2 ml-2 text-xs font-bold text-center uppercase align-middle transition-all bg-transparent border border-solid rounded-lg cursor-pointer  hover:scale-102 hover:shadow-soft-xs active:opacity-85 leading-pro ease-soft-in tracking-tight-soft shadow-soft-md bg-150 bg-x-25 border-fuchsia-500 bg-none text-fuchsia-500 hover:border-fuchsia-500"
                                data-class="bg-white">新增一行空白数据</button>

                            <button @click="saveSetting()" type="button" class="apply-btn">保存</button>
                            <p style="font-size:11px">Tips:<br />
                                0.请确保 访问优化 - CDN请求与缓存 - 启用“智能多线程Fetch引擎” 为开启状态。多线程引擎未开启情况下修改镜像源无效。<br />
                                1.匹配规则会转化为正则，请注意转义<br />
                                2.CyanAcc会根据每次请求的成功与否来给予镜像权重奖励，权重越高的镜像会被越优先命中。<br />
                                3.一小部分镜像由于其不稳定性，天生具有较小的权重。<br />
                                4.拼接规则中形参类型可任意添加，但要保证同一类型的拼接规则中必须含有相同的形参。<br />
                            </p>
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
