"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseTags = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b, _c;
    const mangas = [];
    for (let manga of $('li', '.list-stories').toArray()) {
        let title = $(`h3.title-book > a`, manga).text().trim();
        let subtitle = $(`.episode-book > a`, manga).text().trim();
        let image = (_a = $(`a > img`, manga).attr("src")) !== null && _a !== void 0 ? _a : "";
        let id = (_c = (_b = $(`a`, manga).attr("href")) === null || _b === void 0 ? void 0 : _b.split("/").pop()) !== null && _c !== void 0 ? _c : title;
        if (!id || !title)
            continue;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a, _b, _c;
    const manga = [];
    const collectedIds = [];
    for (let obj of $('li', '.list-stories').toArray()) {
        let title = $(`h3.title-book > a`, obj).text().trim();
        let subtitle = $(`.episode-book > a`, obj).text().trim();
        let image = (_a = $(`a > img`, obj).attr("src")) !== null && _a !== void 0 ? _a : "";
        let id = (_c = (_b = $(`a`, obj).attr("href")) === null || _b === void 0 ? void 0 : _b.split("/").pop()) !== null && _c !== void 0 ? _c : title;
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: encodeURIComponent(id),
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
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
    for (const page of $("li", "ul.pagination-list").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("li > a.is-current").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
