<script setup>
import { ref } from 'vue'
import '@chenyfan/cache-db'
import Notyf from '../../utils/notyf.js'
import reinit from '../../utils/reinit';
const CommentSetting = ref({
    enable: true,
    delay: 3
})
const db = new CacheDB('CyanAcc', "CyanAccDB")
const dbName = 'CommentSetting'
const saveSetting = async () => {
    await db.write(dbName, JSON.stringify(CommentSetting.value))
    !!(await reinit()) ? Notyf.success('设置已保存并应用') : Notyf.info('设置已保存，但尚未应用')
};

; (async () => {
    const data = JSON.parse((await db.read(dbName)) || '{}')
    if (Object.keys(data).length !== 0) CommentSetting.value = data
    else await db.write(dbName, JSON.stringify(CommentSetting.value))
})()

</script>

<template>
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-full px-3">
                <div
                    class="relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border">
                    <div class="p-4 pb-0 mb-0 bg-white border-b-0 rounded-t-2xl">
                        <h6 class="mb-0">评论区设置</h6>
                    </div>
                    <div class="flex-auto p-4">
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input class="check-btn" type="checkbox" v-model="CommentSetting.enable" />
                                    <label class="label-text">启用评论区</label>
                                </div>
                            </li>
                        </ul>
                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">评论区特殊设置</h6>
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <label 
                                class="label-text">评论区等待时间:<span>
                                    {{ CommentSetting.delay }}秒</span></label>
                            <input type="range" min="3" max="20" class="slider w-full" :disabled="!CommentSetting.enable"
                                v-model.number="CommentSetting.delay" />


                        </ul>
                        <br />
                        <button type="button"
                            class="apply-btn"
                            @click="saveSetting()">保存</button>

                    </div>


                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
