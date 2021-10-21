"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeToSlug = exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b, _c;
    const mangas = [];
    const collectedIds = [];
    for (let manga of $('.wrap_update .update_item').toArray()) {
        const title = (_a = $('h3.nowrap a', manga).attr('title')) !== null && _a !== void 0 ? _a : "";
        const id = (_b = $('h3.nowrap a', manga).attr('href')) !== null && _b !== void 0 ? _b : title;
        const image = (_c = $('a img', manga).attr('src')) === null || _c === void 0 ? void 0 : _c.split('-');
        const ext = image === null || image === void 0 ? void 0 : image.splice(-1)[0].split('.')[1];
        const sub = $('a', manga).last().text().trim();
        mangas.push(createMangaTile({
            id: id,
            image: (image === null || image === void 0 ? void 0 : image.join('-')) + '.' + ext,
            title: createIconText({
                text: exports.decodeHTMLEntity(title),
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($, select) => {
    var _a, _b, _c, _d, _e;
    const mangas = [];
    if (select === 1) {
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('a', manga).first().attr('title');
            const id = (_a = $('a', manga).first().attr('href')) !== null && _a !== void 0 ? _a : title;
            const image = (_b = $('.update_image img', manga).attr('src')) === null || _b === void 0 ? void 0 : _b.replace('-61x61', '');
            const sub = 'Chap' + $('a:nth-of-type(1)', manga).text().trim().split('chap')[1];
            mangas.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: exports.decodeHTMLEntity(title !== null && title !== void 0 ? title : "") }),
                subtitleText: createIconText({ text: sub }),
            }));
        }
    }
    else {
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = (_c = $('h3.nowrap a', manga).attr('title')) !== null && _c !== void 0 ? _c : "";
            const id = (_d = $('h3.nowrap a', manga).attr('href')) !== null && _d !== void 0 ? _d : title;
            const image = (_e = $('a img', manga).attr('src')) === null || _e === void 0 ? void 0 : _e.split('-');
            const ext = image === null || image === void 0 ? void 0 : image.splice(-1)[0].split('.')[1];
            const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            mangas.push(createMangaTile({
                id: id,
                image: (image === null || image === void 0 ? void 0 : image.join('-')) + '.' + ext,
                title: createIconText({
                    text: exports.decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }));
        }
    }
    return mangas;
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
    const currentPage = Number($(".wp-pagenavi .current").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
function ChangeToSlug(title) {
    var title, slug;
    //Đổi chữ hoa thành chữ thường
    slug = title.toLowerCase();
    //Đổi ký tự có dấu thành không dấu
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
    slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
    slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
    slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
    slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
    slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
    slug = slug.replace(/đ/gi, 'd');
    return slug;
}
exports.ChangeToSlug = ChangeToSlug;
