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
exports.parseSearch = ($, query, tags) => {
    var _a, _b, _c;
    const manga = [];
    if (!query.title) {
        if (tags[0].includes('http')) {
            for (const element of $('li', '.detail-bxh-ul').toArray()) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_a = $('.image-commic-bxh img', element).attr('data-src')) !== null && _a !== void 0 ? _a : "https://qmanga.co/image/defaul-load.png";
                let id = $('.image-commic-bxh > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                if (title === '')
                    continue;
                manga.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: exports.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
        }
        else {
            for (const element of $('li', '.content-tab').toArray()) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_b = $('.image-commic-tab img', element).attr('data-src')) !== null && _b !== void 0 ? _b : "https://qmanga.co/image/defaul-load.png";
                let id = $('.image-commic-tab > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                if (title === '')
                    continue;
                manga.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: exports.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
        }
    }
    else {
        for (const element of $('li', '.detail-bxh-ul').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = (_c = $('.image-commic-bxh img', element).attr('data-src')) !== null && _c !== void 0 ? _c : "";
            let id = $('.image-commic-bxh > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            if (title === '')
                continue;
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: exports.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    return manga;
};
exports.parseViewMore = ($, select) => {
    var _a, _b;
    const manga = [];
    if (select === 1) {
        for (const element of $('li', '.detail-bxh-ul').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = (_a = $('.image-commic-bxh img', element).attr('data-src')) !== null && _a !== void 0 ? _a : "";
            let id = $('.image-commic-bxh > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            if (title === '')
                continue;
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: exports.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    else {
        for (const element of $('li', '.content-tab').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = (_b = $('.image-commic-tab img', element).attr('data-src')) !== null && _b !== void 0 ? _b : "";
            let id = $('.image-commic-tab > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            if (title === '')
                continue;
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: exports.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
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
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
