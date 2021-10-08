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
    for (let obj of $('li', 'ul#danhsachtruyen').toArray()) {
        let title = $(`.info-bottom > a`, obj).text().trim();
        let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
        var image = $('a', obj).first().attr('data-src');
        let id = (_a = $(`.info-bottom > a`, obj).attr("href")) !== null && _a !== void 0 ? _a : title;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? image : ((image === null || image === void 0 ? void 0 : image.includes('//')) ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('li', 'ul#danhsachtruyen').toArray()) {
        let title = $(`.info-bottom > a`, obj).text().trim();
        let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
        var image = $('a', obj).first().attr('data-src');
        let id = (_a = $(`.info-bottom > a`, obj).attr("href")) !== null && _a !== void 0 ? _a : title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            manga.push(createMangaTile({
                id: encodeURIComponent(id),
                image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? image : ((image === null || image === void 0 ? void 0 : image.includes('//')) ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
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
    for (const page of $("a", "ul.pager > li").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pager > li.active > a").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
