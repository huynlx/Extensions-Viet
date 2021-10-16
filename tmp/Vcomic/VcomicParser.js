"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTime = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
const DOMAIN = 'https://vcomic.net/';
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    const manga = [];
    const collectedIds = [];
    for (let obj of $('.thumb-item-flow', '.col-md-8 > .card:nth-child(2) .row-last-update').toArray()) {
        const title = $('.series-title', obj).text().trim();
        const id = $('.series-title > a', obj).attr('href');
        const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', obj).attr('data-bg');
        const sub = $('.chapter-title  > a', obj).text().trim();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: id,
                image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? (image) : ((image === null || image === void 0 ? void 0 : image.includes('app')) ? (DOMAIN + image) : ('https:' + image)),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: "Chương " + sub,
                }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.parseViewMore = ($) => {
    const manga = [];
    const collectedIds = [];
    for (let obj of $('.thumb-item-flow', '.col-md-8 > .card:nth-child(2) .row-last-update').toArray()) {
        const title = $('.series-title', obj).text().trim();
        const id = $('.series-title > a', obj).attr('href');
        const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', obj).attr('data-bg');
        const sub = $('.chapter-title  > a', obj).text().trim();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: id,
                image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? (image) : ((image === null || image === void 0 ? void 0 : image.includes('app')) ? (DOMAIN + image) : ('https:' + image)),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: "Chương " + sub,
                }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
// export const parseTags = ($: CheerioStatic): TagSection[] => {
//     const arrayTags: Tag[] = [];
//     for (const obj of $("li", "ul").toArray()) {
//         const label = ($("a", obj).text().trim());
//         const id = $('a', obj).attr('href') ?? "";
//         if (id == "") continue;
//         arrayTags.push({
//             id: id,
//             label: label,
//         });
//     }
//     const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) })];
//     return tagSections;
// }
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
    const currentPage = Number($("li > a.active").text().trim());
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
