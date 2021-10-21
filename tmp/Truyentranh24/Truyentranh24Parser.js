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
    const manga = [];
    for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
        let title = $('.item-title', element).text().trim();
        let image = $('.item-thumbnail > img', element).attr("data-src");
        let id = (_b = (_a = $('a', element).first().attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[1]) !== null && _b !== void 0 ? _b : title;
        let subtitle = $("span.background-8", element).text().trim();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($, select) => {
    var _a, _b, _c, _d;
    const manga = [];
    if (select === 1) {
        for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = (_b = (_a = $('a', element).first().attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[1]) !== null && _b !== void 0 ? _b : title;
            let subtitle = $("span.background-8", element).text().trim();
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    else {
        for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = (_d = (_c = $('a', element).first().attr('href')) === null || _c === void 0 ? void 0 : _c.split('/')[1]) !== null && _d !== void 0 ? _d : title;
            let subtitle = $("span.background-1", element).text().trim();
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
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
        const p = Number($('a.page-link', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > span.page-link").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
