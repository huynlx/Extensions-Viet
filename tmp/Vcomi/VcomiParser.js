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
    var _a;
    const manga = [];
    for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
        let title = $('.series-title > a', element).text().trim();
        let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
        if (!(image === null || image === void 0 ? void 0 : image.includes('http'))) {
            if (image === null || image === void 0 ? void 0 : image.startsWith('//')) {
                image = 'https:' + image;
            }
            else {
                image = 'https://vcomi.co/' + image;
            }
        }
        else {
            image = image;
        }
        let id = (_a = $('.series-title > a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
        let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a;
    const manga = [];
    for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
        let title = $('.series-title > a', element).text().trim();
        let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
        if (!(image === null || image === void 0 ? void 0 : image.includes('http'))) {
            if (image === null || image === void 0 ? void 0 : image.startsWith('//')) {
                image = 'https:' + image;
            }
            else {
                image = 'https://vcomi.co/' + image;
            }
        }
        else {
            image = image;
        }
        let id = (_a = $('.series-title > a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
        let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
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
    const currentPage = Number($("ul.pagination > li > a.active").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
