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
    for (let obj of $('li', '.list_wrap').toArray()) {
        let title = $(`.title`, obj).text().trim();
        let subtitle = $(`.chapter > a`, obj).text().trim();
        const image = (_a = $('.manga-thumb > a > img', obj).attr('data-original')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $(`.manga-thumb > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            mangas.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: capitalizeFirstLetter(subtitle),
                }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.parseViewMore = ($, select) => {
    var _a, _b, _c, _d, _e, _f;
    const manga = [];
    const collectedIds = [];
    if (select === 0) {
        for (let obj of $('li', '.list-hot').toArray()) {
            let title = $(`.title`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = (_a = $('.manga-thumb > a > img', obj).attr('data-original')) !== null && _a !== void 0 ? _a : $('.manga-thumb > a > img', obj).attr('src');
            let id = (_b = $(`.manga-thumb > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: capitalizeFirstLetter(subtitle),
                    }),
                }));
                collectedIds.push(id);
            }
        }
    }
    else if (select === 1) {
        for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(3) > .list_wrap > .slick_item').toArray()) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text();
            const image = (_c = $(`.manga-thumb > a > img`, obj).attr('data-original')) !== null && _c !== void 0 ? _c : "";
            let id = (_d = $(`h3.title > a`, obj).attr('href')) !== null && _d !== void 0 ? _d : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: capitalizeFirstLetter(subtitle),
                    }),
                }));
                collectedIds.push(id);
            }
        }
    }
    else {
        for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(4) > .list_wrap > .slick_item').toArray()) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text();
            const image = (_e = $(`.manga-thumb > a > img`, obj).attr('data-original')) !== null && _e !== void 0 ? _e : "";
            let id = (_f = $(`h3.title > a`, obj).attr('href')) !== null && _f !== void 0 ? _f : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: capitalizeFirstLetter(subtitle),
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
    const currentPage = Number($("ul.pagination > li.active > a").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
