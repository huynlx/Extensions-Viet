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
exports.parseSearch = ($, query, tags) => {
    var _a, _b, _c, _d, _e, _f;
    const manga = [];
    if (!query.title) {
        if (tags[0].includes('http')) {
            for (const element of $('.commic-hover', '#content-column').toArray()) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_a = $('.image-commic-tab > img', element).attr('data-src')) !== null && _a !== void 0 ? _a : "";
                let id = (_b = $('a', element).first().attr('href')) !== null && _b !== void 0 ? _b : title;
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                manga.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
        }
        else {
            for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray()) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_c = $('.image-commic-tab > img', element).attr('data-src')) !== null && _c !== void 0 ? _c : "";
                let id = (_d = $('a', element).first().attr('href')) !== null && _d !== void 0 ? _d : title;
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                manga.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
        }
    }
    else {
        for (const element of $('.commic-hover', '#content-column').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = (_e = $('.image-commic-tab > img', element).attr('data-src')) !== null && _e !== void 0 ? _e : "";
            let id = (_f = $('a', element).first().attr('href')) !== null && _f !== void 0 ? _f : title;
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            manga.push(createMangaTile({
                id: id,
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray()) {
        let title = $('.title-commic-tab', element).text().trim();
        let image = (_a = $('.image-commic-tab > img', element).attr('data-src')) !== null && _a !== void 0 ? _a : "";
        let id = (_b = $('a', element).first().attr('href')) !== null && _b !== void 0 ? _b : title;
        let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
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
