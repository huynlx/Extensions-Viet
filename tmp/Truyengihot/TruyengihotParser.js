"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b;
    const manga = [];
    var allItem = $('ul.cw-list li').toArray();
    for (var i in allItem) {
        var item = allItem[i];
        let title = $('.title a', item).text();
        let image = (_b = (_a = $('.thumb', item).attr('style')) === null || _a === void 0 ? void 0 : _a.split(/['']/)[1]) !== null && _b !== void 0 ? _b : "";
        if (!image.includes('http'))
            image = 'https://truyengihot.net/' + image;
        let id = 'https://truyengihot.net' + $('.title a', item).attr('href');
        let subtitle = $('.chapter-link', item).last().text();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: encodeURI(exports.decodeHTMLEntity(image)),
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: exports.decodeHTMLEntity(subtitle) }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    var allItem = $('ul.cw-list li').toArray();
    for (var i in allItem) {
        var item = allItem[i];
        let title = $('.title a', item).text();
        let image = (_b = (_a = $('.thumb', item).attr('style')) === null || _a === void 0 ? void 0 : _a.split(/['']/)[1]) !== null && _b !== void 0 ? _b : "";
        if (!image.includes('http'))
            image = 'https://truyengihot.net/' + image;
        let id = 'https://truyengihot.net' + $('.title a', item).attr('href');
        let subtitle = $('.chapter-link', item).last().text();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: encodeURI(exports.decodeHTMLEntity(image)),
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: exports.decodeHTMLEntity(subtitle) }),
        }));
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li > a.current").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
