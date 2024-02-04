<script setup>
import { ref } from 'vue'
import CacheDB from '@chenyfan/cache-db'
import Notyf from '../../utils/notyf.js'
import reinit from '../../utils/reinit.js'
const AvaFontFamily = [{ "name": "Cascadia Code" }, { "name": "Cascadia Mono" }, { "name": "Arial" }, { "name": "Bahnschrift" }, { "name": "Calibri" }, { "name": "Cambria" }, { "name": "Cambria Math" }, { "name": "Candara" }, { "name": "Comic Sans MS" }, { "name": "Consolas" }, { "name": "Constantia" }, { "name": "Corbel" }, { "name": "Courier New" }, { "name": "Ebrima" }, { "name": "Franklin Gothic" }, { "name": "Gabriola" }, { "name": "Gadugi" }, { "name": "Georgia" }, { "name": "Impact" }, { "name": "Ink Free" }, { "name": "Javanese Text" }, { "name": "Leelawadee UI" }, { "name": "Lucida Console" }, { "name": "Lucida Sans Unicode" }, { "name": "Malgun Gothic" }, { "name": "Microsoft Himalaya" }, { "name": "Microsoft JhengHei" }, { "name": "Microsoft JhengHei UI" }, { "name": "Microsoft New Tai Lue" }, { "name": "Microsoft PhagsPa" }, { "name": "Microsoft Sans Serif" }, { "name": "Microsoft Tai Le" }, { "name": "微软雅黑", "value": "Microsoft YaHei" }, { "name": "Microsoft YaHei UI" }, { "name": "Microsoft Yi Baiti" }, { "name": "MingLiU-ExtB" }, { "name": "PMingLiU-ExtB" }, { "name": "MingLiU_HKSCS-ExtB" }, { "name": "Mongolian Baiti" }, { "name": "MS Gothic" }, { "name": "MS UI Gothic" }, { "name": "MS PGothic" }, { "name": "MV Boli" }, { "name": "Myanmar Text" }, { "name": "Nirmala UI" }, { "name": "Palatino Linotype" }, { "name": "Sans Serif Collection" }, { "name": "Segoe Fluent Icons" }, { "name": "Segoe MDL2 Assets" }, { "name": "Segoe Print" }, { "name": "Segoe Script" }, { "name": "Segoe UI" }, { "name": "Segoe UI Emoji" }, { "name": "Segoe UI Historic" }, { "name": "Segoe UI Symbol" }, { "name": "Segoe UI Variable Small" }, { "name": "Segoe UI Variable Text" }, { "name": "Segoe UI Variable Display" }, { "name": "宋体", "value": "SimSun" }, { "name": "新宋体", "value": "NSimSun" }, { "name": "SimSun-ExtB" }, { "name": "Sitka Small" }, { "name": "Sitka Text" }, { "name": "Sitka Subheading" }, { "name": "Sitka Heading" }, { "name": "Sitka Display" }, { "name": "Sitka Banner" }, { "name": "Sylfaen" }, { "name": "Symbol" }, { "name": "Tahoma" }, { "name": "Times New Roman" }, { "name": "Trebuchet MS" }, { "name": "Verdana" }, { "name": "Webdings" }, { "name": "Wingdings" }, { "name": "Yu Gothic" }, { "name": "Yu Gothic UI" }, { "name": "等线", "value": "DengXian" }, { "name": "仿宋", "value": "FangSong" }, { "name": "楷体", "value": "KaiTi" }, { "name": "黑体", "value": "SimHei" }, { "name": "HoloLens MDL2 Assets" }, { "name": "Agency FB" }, { "name": "Algerian" }, { "name": "Book Antiqua" }, { "name": "Arial Rounded MT" }, { "name": "Baskerville Old Face" }, { "name": "Bauhaus 93" }, { "name": "Bell MT" }, { "name": "Bernard MT" }, { "name": "Bodoni MT" }, { "name": "Bodoni MT Poster" }, { "name": "Bookman Old Style" }, { "name": "Bradley Hand ITC" }, { "name": "Britannic" }, { "name": "Berlin Sans FB" }, { "name": "Broadway" }, { "name": "Brush Script MT" }, { "name": "Bookshelf Symbol 7" }, { "name": "Californian FB" }, { "name": "Calisto MT" }, { "name": "Castellar" }, { "name": "Century Schoolbook" }, { "name": "Centaur" }, { "name": "Century" }, { "name": "Chiller" }, { "name": "Colonna MT" }, { "name": "Cooper" }, { "name": "Copperplate Gothic" }, { "name": "Curlz MT" }, { "name": "Dubai" }, { "name": "Elephant" }, { "name": "Engravers MT" }, { "name": "Eras ITC" }, { "name": "Felix Titling" }, { "name": "Forte" }, { "name": "Franklin Gothic Book" }, { "name": "Freestyle Script" }, { "name": "French Script MT" }, { "name": "Footlight MT" }, { "name": "方正舒体", "value": "FZShuTi" }, { "name": "方正姚体", "value": "FZYaoTi" }, { "name": "Garamond" }, { "name": "Gigi" }, { "name": "Gill Sans MT" }, { "name": "Gill Sans" }, { "name": "Gloucester MT" }, { "name": "Century Gothic" }, { "name": "Goudy Old Style" }, { "name": "Goudy Stout" }, { "name": "Harlow Solid" }, { "name": "Harrington" }, { "name": "Haettenschweiler" }, { "name": "High Tower Text" }, { "name": "Imprint MT Shadow" }, { "name": "Informal Roman" }, { "name": "Blackadder ITC" }, { "name": "Edwardian Script ITC" }, { "name": "Kristen ITC" }, { "name": "Jokerman" }, { "name": "Juice ITC" }, { "name": "Kunstler Script" }, { "name": "Wide Latin" }, { "name": "Lucida Bright" }, { "name": "Lucida Calligraphy" }, { "name": "Leelawadee" }, { "name": "Lucida Fax" }, { "name": "Lucida Handwriting" }, { "name": "Lucida Sans" }, { "name": "Lucida Sans Typewriter" }, { "name": "Magneto" }, { "name": "Maiandra GD" }, { "name": "Matura MT Script Capitals" }, { "name": "Mistral" }, { "name": "Modern No. 20" }, { "name": "Microsoft Uighur" }, { "name": "Monotype Corsiva" }, { "name": "MT Extra" }, { "name": "Niagara Engraved" }, { "name": "Niagara Solid" }, { "name": "OCR A" }, { "name": "Old English Text MT" }, { "name": "Onyx" }, { "name": "MS Outlook" }, { "name": "Palace Script MT" }, { "name": "Papyrus" }, { "name": "Parchment" }, { "name": "Perpetua" }, { "name": "Perpetua Titling MT" }, { "name": "Playbill" }, { "name": "Poor Richard" }, { "name": "Pristina" }, { "name": "Rage" }, { "name": "Ravie" }, { "name": "MS Reference Sans Serif" }, { "name": "MS Reference Specialty" }, { "name": "Rockwell" }, { "name": "Script MT" }, { "name": "Showcard Gothic" }, { "name": "隶书", "value": "LiSu" }, { "name": "幼圆", "value": "YouYuan" }, { "name": "Snap ITC" }, { "name": "华文彩云", "value": "STCaiyun" }, { "name": "Stencil" }, { "name": "华文仿宋", "value": "STFangsong" }, { "name": "华文琥珀", "value": "STHupo" }, { "name": "华文楷体", "value": "STKaiti" }, { "name": "华文隶书", "value": "STLiti" }, { "name": "华文宋体", "value": "STSong" }, { "name": "华文细黑", "value": "STXihei" }, { "name": "华文行楷", "value": "STXingkai" }, { "name": "华文新魏", "value": "STXinwei" }, { "name": "华文中宋", "value": "STZhongsong" }, { "name": "Tw Cen MT" }, { "name": "Tempus Sans ITC" }, { "name": "Viner Hand ITC" }, { "name": "Vivaldi" }, { "name": "Vladimir Script" }, { "name": "Wingdings 2" }, { "name": "Wingdings 3" }, { "name": "DejaVu Sans Mono" }, { "name": "Marlett" }, { "name": "自定义", "value": "custom" }]
const FontSetting = ref({
    FontFamily: 'Microsoft YaHei',
    CustomFontFamily: '',
    FontSize: 19,
    Force_FontFamily: false,
    Force_FontSize: false,
})
const db = new CacheDB('CyanAcc', "CyanAccDB")
const dbName = 'FontSetting'
const saveSetting = async () => {
    await db.write(dbName, JSON.stringify(FontSetting.value))
    !!(await reinit()) ? Notyf.success('设置已保存并应用') : Notyf.info('设置已保存，但尚未应用')
}

!(async () => {
    const data = JSON.parse((await db.read(dbName)) || '{}')
    if (Object.keys(data).length !== 0) FontSetting.value = data
    else await db.write(dbName, JSON.stringify(FontSetting.value))
})()

</script>

<template>
    <div class="w-full p-6 mx-auto">
        <div class="flex flex-wrap -mx-3">
            <div class="w-full max-w-full px-3">
                <div
                    class="relative flex flex-col h-full min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border">
                    <div class="p-4 pb-0 mb-0 bg-white border-b-0 rounded-t-2xl">
                        <h6 class="mb-0">字体与大小 / Font And Size</h6>
                    </div>
                    <div class="flex-auto p-4">
                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">字体选择</h6>
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <li class="relative block px-0 py-2 bg-white border-0 rounded-t-lg text-inherit">
                                <div class="min-h-6 mb-0.5 block pl-0">
                                    <input
                                        class="mt-0.54 rounded-10 duration-250 ease-soft-in-out after:rounded-circle after:shadow-soft-2xl after:duration-250 checked:after:translate-x-5.25 h-5 relative float-left ml-auto w-10 cursor-pointer appearance-none border border-solid border-gray-200 bg-slate-800/10 bg-none bg-contain bg-left bg-no-repeat align-top transition-all after:absolute after:top-px after:h-4 after:w-4 after:translate-x-px after:bg-white after:content-[''] checked:border-slate-800/95 checked:bg-slate-800/95 checked:bg-none checked:bg-right"
                                        type="checkbox" v-model="FontSetting.Force_FontFamily" />
                                    <label class="label-text">
                                        启用自定义字体</label>
                                    <select class="select-form" aria-label="标准字体" :disabled="!FontSetting.Force_FontFamily"
                                        v-model="FontSetting.FontFamily">
                                        <option v-for="item in AvaFontFamily" :value="item.value || item.name" :style="{
                                            'font-family': item.value || item.name
                                        }">
                                            {{ item.name }}
                                        </option>
                                    </select>
                                    <input type="text" class="select-form" placeholder="自定义字体"
                                        :disabled="!(FontSetting.Force_FontFamily && FontSetting.FontFamily === 'custom')"
                                        v-model="FontSetting.CustomFontFamily" />
                                </div>
                            </li>
                        </ul>
                        <h6 class="mt-6 font-bold leading-tight uppercase text-xs text-slate-500">正文字体大小设置</h6>
                        <input
                            class="mt-0.54 rounded-10 duration-250 ease-soft-in-out after:rounded-circle after:shadow-soft-2xl after:duration-250 checked:after:translate-x-5.25 h-5 relative float-left ml-auto w-10 cursor-pointer appearance-none border border-solid border-gray-200 bg-slate-800/10 bg-none bg-contain bg-left bg-no-repeat align-top transition-all after:absolute after:top-px after:h-4 after:w-4 after:translate-x-px after:bg-white after:content-[''] checked:border-slate-800/95 checked:bg-slate-800/95 checked:bg-none checked:bg-right"
                            type="checkbox" v-model="FontSetting.Force_FontSize" />
                        <label class="label-text">
                            启用自定义字体大小</label>
                        <ul class="flex flex-col pl-0 mb-0 rounded-lg">
                            <label class="label-text">正文字体大小:
                                <span :style="{
                                    'font-size': FontSetting.FontSize + 'px'
                                }">
                                    {{ FontSetting.FontSize }}px
                                </span>
                            </label>
                            <input :disabled="!FontSetting.Force_FontSize" v-model="FontSetting.FontSize" type="range"
                                min="4" max="400" class="slider w-full">
                        </ul>
                        <br />
                        <button type="button" class="apply-btn" @click="saveSetting()">保存</button>
                        <p style="font-size:11px">Tips:<br />
                            1.自定义字体大小仅支持正文，标题等其他字体大小不会改变<br />
                            2.若启用自定义字体，请确保当前字体已在此浏览器内注册。你可以通过右侧*高级设置-html注入 来注入自定义字体文件<br />
                            3.若希望启用多字体群支持，请自行使用自定义字体<br />
                        </p>

                    </div>


                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
