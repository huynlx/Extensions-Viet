"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities (unescape string)
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b;
    const collectedIds = [];
    const mangas = [];
    for (let obj of $('p:not(:first-child)', '.list').toArray()) {
        let title = $(`a`, obj).text().trim();
        let subtitle = 'Chương ' + $(`span:nth-child(2)`, obj).text().trim();
        const image = (_a = $('img', $(obj).next()).attr('src')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $(`a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            mangas.push(createMangaTile({
                id: encodeURI(id),
                image: encodeURI(image.replace('150', '200')),
                title: createIconText({ text: exports.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.parseViewMore = ($, select) => {
    var _a, _b, _c;
    const manga = [];
    const collectedIds = [];
    if (select === 1) {
        for (let obj of $('.row', '.list-mainpage .storyitem').toArray()) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`div:nth-child(2) > div:nth-child(4) > span:nth-child(1) > .color-red`, obj).text();
            const image = $(`div:nth-child(1) > a > img`, obj).attr('src');
            let id = (_a = $(`div:nth-child(1) > a`, obj).attr('href')) !== null && _a !== void 0 ? _a : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                    title: createIconText({ text: exports.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: 'Chương ' + subtitle }),
                }));
                collectedIds.push(id);
            }
        }
    }
    else {
        for (let obj of $('p:not(:first-child)', '.list').toArray()) {
            let title = $(`a`, obj).text().trim();
            let subtitle = 'Chương ' + $(`span:nth-child(2)`, obj).text().trim();
            const image = (_b = $('img', $(obj).next()).attr('src')) !== null && _b !== void 0 ? _b : "";
            let id = (_c = $(`a`, obj).attr('href')) !== null && _c !== void 0 ? _c : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: encodeURI(image.replace('150', '200')),
                    title: createIconText({
                        text: exports.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
                }));
                collectedIds.push(id);
            }
        }
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a", "ul.pagination > li").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li > select > option").find(":selected").text().split(' ')[1]);
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
// decodeHTMLEntity(str: string): string { //hàm của bato.to
//     return str.replace(/&#(\d+);/g, function (match, dec) {
//         return String.fromCharCode(dec);
//     })
// }
