<script setup>
import { ref, reactive } from 'vue'
import Monaco from '../../utils/CodeEditor.vue'
const Content = ref('')
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
}

</script>

<template>
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-75 px-6">
                <div class="px-3 relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border min-h-screen">
                    <div class="monacoEditor">
                        <Monaco :option="editorp" 
                        :value="Content"
                        @update-content="handleContentUpdate"
                        />
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
    margin-top: 10px;
}
</style>
