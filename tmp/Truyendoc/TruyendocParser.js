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
    var _a;
    const mangas = [];
    const collectedIds = [];
    for (let manga of $('.list_comic > .left').toArray()) {
        const title = $('h2', manga).text().trim();
        const id = (_a = $('.thumbnail > a', manga).attr('href')) !== null && _a !== void 0 ? _a : title;
        const image = $('.thumbnail img', manga).attr('src');
        const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: encodeURI(image !== null && image !== void 0 ? image : ""),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a;
    const mangas = [];
    const collectedIds = [];
    for (let manga of $('.list_comic > .left').toArray()) {
        const title = $('h2', manga).text().trim();
        const id = (_a = $('.thumbnail > a', manga).attr('href')) !== null && _a !== void 0 ? _a : title;
        const image = $('.thumbnail img', manga).attr('src');
        const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: encodeURI(image !== null && image !== void 0 ? image : ""),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.isLastPage = ($) => {
    var _a;
    let isLast = false;
    const pages = (_a = $.html().match(/setPagiNation(.*)]]>/)) === null || _a === void 0 ? void 0 : _a[1].replace('(', '').split(',');
    const lastPage = Number(pages === null || pages === void 0 ? void 0 : pages[0]);
    const currentPage = Number(pages === null || pages === void 0 ? void 0 : pages[1]);
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
