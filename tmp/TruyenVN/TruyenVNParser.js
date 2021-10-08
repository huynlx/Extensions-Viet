"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b, _c;
    const mangas = [];
    for (let obj of $('.entry ', '.form-row').toArray()) {
        let title = (_a = $(`a`, obj).attr('title')) !== null && _a !== void 0 ? _a : "";
        let subtitle = $(`span.link`, obj).text().trim() !== '' ? $(`span.link`, obj).text().trim() : ($(`span.bg-info`, obj).text().trim() + ' views');
        const image = (_b = $(`a > img`, obj).attr('data-src')) !== null && _b !== void 0 ? _b : "";
        let id = (_c = $(`a`, obj).attr("href")) !== null && _c !== void 0 ? _c : title;
        mangas.push(createMangaTile({
            id: id,
            image,
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a, _b, _c;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('.entry ', '.form-row').toArray()) {
        let title = (_a = $(`a`, obj).attr('title')) !== null && _a !== void 0 ? _a : "";
        let subtitle = $(`span.link`, obj).text().trim();
        const image = (_b = $(`a > img`, obj).attr('data-src')) !== null && _b !== void 0 ? _b : "";
        let id = (_c = $(`a`, obj).attr("href")) !== null && _c !== void 0 ? _c : title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            manga.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({ text: exports.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a.page-numbers", ".z-pagination").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".z-pagination > span.current").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
