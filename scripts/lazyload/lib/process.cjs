'use strict';

function lazyProcess(htmlContent) {
    let loadingImage = this.config.lazyload.loadingImage || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAABlBMVEXMzMyWlpYU2uzLAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAACklEQVQImWNgAAAAAgAB9HFkpgAAAABJRU5ErkJggg==';
    return htmlContent.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, function (str, p1, p2) {
        if (/data-srcset/gi.test(str)) {
            return str;
        }
        if (/src="data:image(.*?)/gi.test(str)) {
            return str;
        }
        if (/no-lazy/gi.test(str)) {
            return str;
        }
        return str.replace(`src="${p2}"`, `src="${p2}" class="lazy" data-srcset="${p2}" srcset="${loadingImage}"`);
    });
}

module.exports.processPost = function (data) {
    data.content = lazyProcess.call(this, data.content);
    return data;
};

module.exports.processSite = function (htmlContent) {
    return lazyProcess.call(this, htmlContent);
};