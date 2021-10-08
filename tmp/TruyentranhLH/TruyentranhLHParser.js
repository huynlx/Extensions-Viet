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
    var _a, _b;
    const mangas = [];
    for (let obj of $('.thumb-item-flow', '.col-12 > .card:nth-child(2) > .card-body > .row').toArray()) {
        let title = $(`.series-title > a`, obj).text().trim();
        let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
        const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
        let id = (_b = (_a = $(`.series-title > a`, obj).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/").pop()) !== null && _b !== void 0 ? _b : title;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('.thumb-item-flow', '.col-md-8 > .card > .card-body > .row').toArray()) {
        let title = $(`.series-title > a`, obj).text().trim();
        let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
        const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
        let id = (_b = (_a = $(`.series-title > a`, obj).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/").pop()) !== null && _b !== void 0 ? _b : title;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: encodeURIComponent(id),
                image: image !== null && image !== void 0 ? image : "",
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
    for (const page of $("a", ".pagination_wrap").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".pagination_wrap > a.current").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
