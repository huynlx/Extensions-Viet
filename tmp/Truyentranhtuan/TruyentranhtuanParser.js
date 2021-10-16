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
    var _a;
    const manga = [];
    for (const element of $('#new-chapter .manga-focus').toArray()) {
        let title = $('.manga > a', element).text().trim();
        let id = (_a = $('.manga > a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
        let subtitle = $('.chapter > a', element).text().trim();
        let img = '';
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: encodeURI(img !== null && img !== void 0 ? img : ""),
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    for (const element of $('#new-chapter .manga-update').toArray()) {
        let title = $('a', element).first().text().trim();
        let img = (_a = $('img', element).attr('src')) === null || _a === void 0 ? void 0 : _a.replace('-80x90', '');
        let id = (_b = $('a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
        let subtitle = $('a', element).last().text().trim();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: encodeURI(img !== null && img !== void 0 ? img : ""),
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("li", "#page-nav").toArray()) {
        const p = Number($('span', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("#page-nav li.current-page").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
