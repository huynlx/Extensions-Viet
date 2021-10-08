"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
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
    for (const element of $('li', '.manga-list > ul').toArray()) {
        let title = $('.manga-info > h3 > a', element).text().trim();
        if (!title)
            continue;
        let image = (_a = $('.manga-thumb > img', element).attr('data-original')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $('a', element).attr('href')) !== null && _b !== void 0 ? _b : "";
        let subtitle = $(`.chapter > a`, element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    for (const element of $('li', '.manga-list > ul').toArray()) {
        let title = $('.manga-info > h3 > a', element).text().trim();
        if (!title)
            continue;
        let image = (_a = $('.manga-thumb > img', element).attr('data-original')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $('a', element).attr('href')) !== null && _b !== void 0 ? _b : "";
        let subtitle = $(`.chapter > a`, element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
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
    const currentPage = Number($("ul.pagination > li.active > span").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
