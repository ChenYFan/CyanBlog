import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [vue()],
  base: '/CyanAcc/',
  build: {
    outDir: '../public/panel'
  },
  server: {
    cors: true
  },
  optimizeDeps: {
    include: [
      `monaco-editor/esm/vs/language/json/json.worker`,
      `monaco-editor/esm/vs/language/css/css.worker`,
      `monaco-editor/esm/vs/language/html/html.worker`,
      `monaco-editor/esm/vs/language/typescript/ts.worker`,
      `monaco-editor/esm/vs/editor/editor.worker`
    ]
  }
})
