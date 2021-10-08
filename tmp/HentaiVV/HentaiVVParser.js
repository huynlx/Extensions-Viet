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
    const collectedIds = [];
    const mangas = [];
    for (let obj of $('li', '.theloai-thumlist').toArray()) {
        let title = $(`.crop-text-2 > a`, obj).text().trim();
        const image = (_a = $('a > img', obj).attr('data-src')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $(`.crop-text-2 > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            mangas.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                })
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.parseViewMore = ($, select) => {
    var _a, _b;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('li', '.theloai-thumlist').toArray()) {
        let title = $(`.crop-text-2 > a`, obj).text().trim();
        const image = (_a = $('a > img', obj).attr('data-src')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $(`.crop-text-2 > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            manga.push(createMangaTile({
                id: id,
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({
                    text: title !== null && title !== void 0 ? title : "",
                })
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a", "ul.pagination").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > a").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
