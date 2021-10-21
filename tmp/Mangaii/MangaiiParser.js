"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTime = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
const DOMAIN = 'https://truyentranhaudio.online/';
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a;
    const mangas = [];
    const collectedIds = [];
    for (let manga of $('.content .card-list > .card').toArray()) {
        const title = $('.card-title', manga).text().trim();
        const id = (_a = $('.card-title > a', manga).attr('href')) !== null && _a !== void 0 ? _a : title;
        const image = $('.card-img', manga).attr('src');
        const sub = $('.list-chapter > li:first-child > a', manga).text().trim();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a;
    const mangas = [];
    const collectedIds = [];
    for (let manga of $('.content .card-list > .card').toArray()) {
        const title = $('.card-title', manga).text().trim();
        const id = (_a = $('.card-title > a', manga).attr('href')) !== null && _a !== void 0 ? _a : title;
        const image = $('.card-img', manga).attr('src');
        const sub = $('.list-chapter > li:first-child > a', manga).text().trim();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
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
    for (const page of $("li.page-item", "ul.pagination").toArray()) {
        const p = Number($('a.page-link', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.page-item.active > a.page-link").text().trim());
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
