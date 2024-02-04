
<script setup>
import { ref, reactive, onMounted, toRaw, watch } from 'vue';
const props = defineProps({
    data: Object,
    keyintro: Object
});
const emit = defineEmits(['updateContent'])
const keys = ref([]);
const searchKeys = (data) => {
    for (var item in data) {
        for (var key in data[item]) {
            if (!keys.value.includes(key)) {
                keys.value.push(key);
            }
        }
    }
}

watch(() => props.data, (newVal) => {
    searchKeys(newVal);
    emit('updateContent', newVal)
});


const toggleCellEdit = (index, key, data,type) => {
    switch (type) {
        case "number":
            data = Number(data);
            break;
        case "boolean":
            data = Boolean(data);
            break;
        case "json":
            data = JSON.parse(data);
            break;
        default:
            break;
    }
    props.data[index][key] = data;
    console.log(props.data[index][key]);
}

</script>
<template>
    <div class="flex-auto px-0 pt-0 pb-2">
        <div class="p-0 overflow-x-auto">
            <table class="items-center justify-center w-full mb-0 align-top border-gray-200 text-slate-500">
                <thead class="align-bottom">
                    <tr>
                        <th v-for="key in keys"
                            class="px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-gray-200 shadow-none text-xxs border-b-solid tracking-none whitespace-nowrap text-slate-400 opacity-70"
                            :style="{
                                width: props.keyintro[key].width
                            }">{{ props.keyintro[key].description || key }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in props.data">
                        <template v-for="key in keys">
                            <td :contenteditable="true"
                                class="p-2 align-middle bg-transparent border-b whitespace-nowrap shadow-transparent"
                                @input="event => toggleCellEdit(index, key, event.target.innerText, props.keyintro[key].type)">
                                {{ item[key] }}
                            </td>
                        </template>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>