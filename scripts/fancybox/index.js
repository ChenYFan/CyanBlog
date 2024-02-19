'use strict'

if (!hexo.config.fancybox.enable) {
    console.log('Fancybox is not enabled');
    return;
}


function fancyboxProcess(htmlContent) {
    //如果存在alt，则将datacaption设置为alt的值，否则不设置
    
    return htmlContent
        .replace(/<img(.*?)src="(.*?)"(.*?)>/g, function (match, p1, p2, p3) {
            if (match.match(/no-fancybox/g)) return match
            return `<a href="${p2}" data-fancybox="gallery" data-caption="${(()=>{
                const alt = (p1.match(/alt="(.*?)"/) || p3.match(/alt="(.*?)"/) || '')
                if (!alt) return '该图片无描述'
                return alt[1]
            })()}">
            <img${p1}src="${p2}"${p3}>
            </a>`;
        })
}

hexo.extend.filter.register('after_render:html', function (htmlContent) {
    return fancyboxProcess.call(this, htmlContent);
});