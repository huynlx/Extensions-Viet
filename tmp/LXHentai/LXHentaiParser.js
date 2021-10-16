"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseTags = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($, query) => {
    var _a;
    const manga = [];
    // const collectedIds: string[] = [];
    var loop = [];
    if (query.title) {
        loop = $('div.py-2', '.row').toArray();
    }
    else {
        loop = $('div.py-2', '.col-md-8 .row').toArray();
    }
    for (let obj of loop) {
        const title = $('a', obj).last().text().trim();
        const id = (_a = $('a', obj).last().attr('href')) !== null && _a !== void 0 ? _a : title;
        const image = $('div', obj).first().css('background');
        const bg = image === null || image === void 0 ? void 0 : image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        const sub = $('a', obj).first().text().trim();
        // if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: 'https://lxhentai.com' + id,
            image: 'https://lxhentai.com' + bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }));
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
};
exports.parseViewMore = ($) => {
    var _a;
    const manga = [];
    // const collectedIds: string[] = [];
    for (let obj of $('div.col-md-3', '.main .col-md-8 > .row').toArray()) {
        const title = $('a', obj).last().text().trim();
        const id = (_a = $('a', obj).last().attr('href')) !== null && _a !== void 0 ? _a : title;
        const image = $('div', obj).first().css('background');
        const bg = image === null || image === void 0 ? void 0 : image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        const sub = $('a', obj).first().text().trim();
        // if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: 'https://lxhentai.com' + id,
            image: 'https://lxhentai.com' + bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }));
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
};
exports.parseTags = ($) => {
    var _a;
    const arrayTags = [];
    for (const obj of $("li", "ul").toArray()) {
        const label = ($("a", obj).text().trim());
        const id = (_a = $('a', obj).attr('href')) !== null && _a !== void 0 ? _a : "";
        if (id == "")
            continue;
        arrayTags.push({
            id: id,
            label: label,
        });
    }
    const tagSections = [createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) })];
    return tagSections;
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
    const currentPage = Number($("li.active > a").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
// const decodeHTMLEntity = (str: string): string => {
//     return entities.decodeHTML(str);
// }
