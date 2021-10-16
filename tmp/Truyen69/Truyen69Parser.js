"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = (json) => {
    const mangas = [];
    const collectedIds = [];
    for (let manga of json) {
        const title = manga.manga_Name;
        const id = 'https://www.truyen69.ml' + manga.manga_Url;
        const image = 'https://www.truyen69.ml' + manga.manga_Cover;
        const sub = manga.manga_LChap;
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
exports.parseViewMore = (json) => {
    const mangas = [];
    const collectedIds = [];
    for (let manga of json) {
        const title = manga.manga_Name;
        const id = 'https://www.truyen69.ml' + manga.manga_Url;
        const image = 'https://www.truyen69.ml' + manga.manga_Cover;
        const sub = manga.manga_LChap;
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
    for (const page of $("li", "ul.pager").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pager > li.active > a").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
