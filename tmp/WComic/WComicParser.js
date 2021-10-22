"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTime = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a;
    const mangas = [];
    for (let obj of $('.wc_comic_list > .wc_item').toArray()) {
        let title = $(`a`, obj).first().attr('title');
        let subtitle = $(`.row_one > span:first-child`, obj).text().trim();
        const image = $(`a:first-child img`, obj).attr('src');
        let id = (_a = $(`a:first-child`, obj).attr('href')) !== null && _a !== void 0 ? _a : "";
        mangas.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({
                text: title !== null && title !== void 0 ? title : "",
            }),
            subtitleText: createIconText({
                text: subtitle,
            }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('.wc_comic_list > .wc_item').toArray()) {
        let title = $(`a`, obj).first().attr('title');
        let subtitle = $(`.row_one > span:first-child`, obj).text().trim();
        const image = $(`a:first-child img`, obj).attr('src');
        let id = (_a = $(`a:first-child`, obj).attr('href')) !== null && _a !== void 0 ? _a : "";
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({
                    text: title !== null && title !== void 0 ? title : "",
                }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a", ".pagination").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".pagination a.active_page").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('giây')) {
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
    else if (timeAgo.includes('tuần')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7);
    }
    else if (timeAgo.includes('tháng')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4);
    }
    else if (timeAgo.includes('năm')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4 * 12);
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
            time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
        }
    }
    return time;
}
exports.convertTime = convertTime;
