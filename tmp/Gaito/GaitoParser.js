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
exports.parseSearch = (json) => {
    const manga = [];
    const collectedIds = [];
    var element = '';
    for (element of json) {
        let title = element.title;
        let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
        let id = element.id;
        if (!collectedIds.includes(title)) {
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({
                    text: title !== null && title !== void 0 ? title : ""
                })
            }));
            collectedIds.push(title);
        }
    }
    return manga;
};
exports.parseViewMore = (json, select) => {
    const manga = [];
    const collectedIds = [];
    var element = '';
    for (element of json) {
        let title = element.title;
        let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
        let id = element.id;
        if (!collectedIds.includes(title)) {
            manga.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({
                    text: title !== null && title !== void 0 ? title : ""
                })
            }));
            collectedIds.push(title);
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
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
