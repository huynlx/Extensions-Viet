"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b;
    const mangas = [];
    for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray()) {
        let title = $(`.detail > h3 > a`, obj).text().trim();
        let subtitle = $(`.chapters a`, obj).attr('title');
        const image = $(`.cover img`, obj).attr('data-src');
        let id = (_b = (_a = $(`.detail > h3 > a`, obj).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/").pop()) !== null && _b !== void 0 ? _b : title;
        if (!id || !subtitle)
            continue;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray()) {
        let title = $(`.detail > h3 > a`, obj).text().trim();
        let subtitle = $(`.chapters a`, obj).attr('title');
        const image = $(`.cover img`, obj).attr('data-src');
        let id = (_b = (_a = $(`.detail > h3 > a`, obj).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/").pop()) !== null && _b !== void 0 ? _b : title;
        if (!id || !subtitle)
            continue;
        manga.push(createMangaTile({
            id: encodeURIComponent(id),
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
        collectedIds.push(id);
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a", ".paging > ul > li").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".paging > ul > li > a.active").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
