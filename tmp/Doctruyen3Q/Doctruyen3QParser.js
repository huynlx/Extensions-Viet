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
    for (const element of $('.content-search-left > .main-left .item-manga > .item').toArray()) {
        let title = $('.caption > h3 > a', element).text().trim();
        let img = (_a = $('.image-item > a > img', element).attr("data-original")) !== null && _a !== void 0 ? _a : $('.image-item > a > img', element).attr('src');
        let id = (_b = $('.caption > h3 > a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
        let subtitle = $("ul > li:first-child > a", element).text().trim();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: img !== null && img !== void 0 ? img : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($, homepageSectionId) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const manga = [];
    if (homepageSectionId === 'hot') {
        for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = (_a = $('.image-item > a > img', element).attr("data-original")) !== null && _a !== void 0 ? _a : $('.image-item > a > img', element).attr('src');
            let id = (_b = $('.caption > h3 > a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: img !== null && img !== void 0 ? img : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    else if (homepageSectionId === 'new_updated') {
        for (const element of $('#home > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = (_c = $('.image-item > a > img', element).attr("data-original")) !== null && _c !== void 0 ? _c : $('.image-item > a > img', element).attr('src');
            let id = (_d = $('.caption > h3 > a', element).attr('href')) !== null && _d !== void 0 ? _d : title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: img !== null && img !== void 0 ? img : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    else if (homepageSectionId === 'boy') {
        for (const element of $('#male-comics > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = (_e = $('.image-item > a > img', element).attr("data-original")) !== null && _e !== void 0 ? _e : $('.image-item > a > img', element).attr('src');
            let id = (_f = $('.caption > h3 > a', element).attr('href')) !== null && _f !== void 0 ? _f : title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: img !== null && img !== void 0 ? img : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
    }
    else {
        for (const element of $('#female-comics > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = (_g = $('.image-item > a > img', element).attr("data-original")) !== null && _g !== void 0 ? _g : $('.image-item > a > img', element).attr('src');
            let id = (_h = $('.caption > h3 > a', element).attr('href')) !== null && _h !== void 0 ? _h : title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: img !== null && img !== void 0 ? img : "",
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
    const currentPage = Number($("ul.pagination > li.active").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
