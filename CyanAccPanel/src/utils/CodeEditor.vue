<template>
    <div class="codemirror">
        <div id="monacoEditor" class="monaco-editor" ref="monacoEditor"></div>
    </div>
</template>
<script setup>
// 引入vue模块
import { ref, reactive, onMounted, toRaw, watch } from 'vue';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import * as monaco from "monaco-editor";
const getVal = (ele) => {
    return toRaw(ele).getValue(); //获取编辑器中的文本
}
//引入monaco编辑器
const emit = defineEmits(['updateContent'])
self.MonacoEnvironment = {
    getWorker(workerId, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker()
        }
        if (label === 'html') {
            return new htmlWorker()
        }
        if (['typescript', 'javascript'].includes(label)) {
            return new tsWorker()
        }
        return new editorWorker();
    },
};
let code = ref(''); //代码
let language = ref(''); //语言
let editor = ref(null); //编辑器实例
const monacoEditor = ref(null);
// 定义从父组件接收的属性
const props = defineProps({
    option: Object,
    value: String
});

//监听props.value的变化
watch(() => props.value, (newVal) => {
    if (getVal(editor.value) !== newVal) {
        toRaw(editor.value).setValue(newVal);
    }
});

//挂载
onMounted(() => {
    language.value = props.option.options.language;
    code.value = props.option.options.code;
    initEditor(language.value, code.value);
});

//初始化编辑器
function initEditor(language, code) {
    editor.value = monaco.editor.create(monacoEditor.value, {
        value: code,
        theme: "vs-light", // 主题
        language: language,
        folding: true, // 是否折叠
        foldingHighlight: true, // 折叠等高线
        foldingStrategy: "indentation", // 折叠方式  auto | indentation
        showFoldingControls: "always", // 是否一直显示折叠 always | mouseover
        disableLayerHinting: true, // 等宽优化
        emptySelectionClipboard: false, // 空选择剪切板
        selectionClipboard: false, // 选择剪切板
        automaticLayout: true, // 自动布局
        codeLens: false, // 代码镜头
        scrollBeyondLastLine: false, // 滚动完最后一行后再滚动一屏幕
        colorDecorators: true, // 颜色装饰器
        accessibilitySupport: "off", // 辅助功能支持  "auto" | "off" | "on"
        lineNumbers: "on", // 行号 取值： "on" | "off" | "relative" | "interval" | function
        lineNumbersMinChars: 5, // 行号最小字符   number
        readOnly: false, //是否只读  取值 true | false
    });
    editor.value.onDidChangeModelContent(() => {
        if (editor.value) {
            emit('updateContent', getVal(editor.value))
        }
    })

}
</script>
<style scoped>
.codemirror,
.monaco-editor {
    width: 100%;
    height: calc(100vh - 100px);
}
</style>