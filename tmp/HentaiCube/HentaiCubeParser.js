"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTime = exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
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
exports.parseSearch = ($, set) => {
    var _a, _b, _c, _d;
    const collectedIds = [];
    const mangas = [];
    if (set === 1) {
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = (_a = $('.c-image-hover > a > img', obj).attr('data-src')) !== null && _a !== void 0 ? _a : "";
            let id = (_b = $(`.c-image-hover > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                mangas.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({
                        text: exports.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
                    }),
                }));
                collectedIds.push(id);
            }
        }
    }
    else {
        for (let obj of $('.page-listing-item > .row > .col-12', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = (_c = $('.c-image-hover > a > img', obj).attr('data-src')) !== null && _c !== void 0 ? _c : "";
            let id = (_d = $(`.c-image-hover > a`, obj).attr('href')) !== null && _d !== void 0 ? _d : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                mangas.push(createMangaTile({
                    id: id,
                    image: encodeURI(image.replace('-110x150', '')),
                    title: createIconText({
                        text: exports.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
                    }),
                }));
                collectedIds.push(id);
            }
        }
    }
    return mangas;
};
exports.parseViewMore = ($, select) => {
    var _a, _b, _c;
    const manga = [];
    const collectedIds = [];
    if (select === 1 || select === 2 || select === 0) {
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = (_a = $('.c-image-hover > a > img', obj).attr('data-src')) !== null && _a !== void 0 ? _a : "";
            let id = (_b = $(`.c-image-hover > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({
                        text: (_c = exports.decodeHTMLEntity(title)) !== null && _c !== void 0 ? _c : "",
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
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
    for (const page of $("a", ".wp-pagenavi").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".wp-pagenavi > span.current").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
exports.convertTime = (timeAgo) => {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
        time = new Date(Date.now() - trimmed * 1000); // => mili giây (1000 ms = 1s)
    }
    else if (timeAgo.includes('phút')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('giờ')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('ngày')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('năm')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        if (timeAgo.includes(":")) {
            let split = timeAgo.split(' ');
            let H = split[0]; //vd => 21:08
            let D = split[1]; //vd => 25/08 
            let fixD = D.split('/');
            let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
            time = new Date(finalD + ' ' + H);
        }
        else {
            let split = timeAgo.split('/'); //vd => 05/12/18
            time = new Date(split[1] + '/' + split[0] + '/' + split[2]);
        }
    }
    return time;
};
