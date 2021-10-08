"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.change_alias = exports.parseManga = exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a;
    let mangas = [];
    let el = $(".leftCol .list-truyen-item-wrap");
    for (var i = 0; i < el.length; i++) {
        var e = el[i];
        let title = $("h3 a", e).first().text();
        let subtitle = $("a:nth-of-type(2)", e).last().text();
        const image = (_a = $("img", e).first().attr("src")) !== null && _a !== void 0 ? _a : "";
        let id = $("h3 a", e).first().attr("href");
        // if (!id || !subtitle) continue;
        mangas.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : title,
            image,
            title: createIconText({
                text: title,
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
    let mangas = [];
    let el = $(".leftCol .list-truyen-item-wrap");
    for (var i = 0; i < el.length; i++) {
        var e = el[i];
        let title = $("h3 a", e).first().text();
        let subtitle = $("a:nth-of-type(2)", e).last().text();
        const image = (_a = $("img", e).first().attr("src")) !== null && _a !== void 0 ? _a : "";
        let id = $("h3 a", e).first().attr("href");
        // if (!id || !subtitle) continue;
        mangas.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : title,
            image,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: subtitle,
            }),
        }));
    }
    return mangas;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a", ".phan-trang").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".phan-trang > a.pageselect").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
exports.parseManga = ($) => {
    var _a;
    let mangas = [];
    let el = $(".leftCol .list-truyen-item-wrap");
    for (var i = 0; i < 20; i++) {
        var e = el[i];
        let title = $("h3 a", e).first().text();
        let subtitle = $("a:nth-of-type(2)", e).last().text();
        const image = (_a = $("img", e).first().attr("src")) !== null && _a !== void 0 ? _a : "";
        let id = $("h3 a", e).first().attr("href");
        // if (!id || !subtitle) continue;
        mangas.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : title,
            image,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: subtitle,
            }),
        }));
    }
    return mangas;
};
function change_alias(alias) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/Ă |Ă¡|áº¡|áº£|Ă£|Ă¢|áº§|áº¥|áº­|áº©|áº«|Äƒ|áº±|áº¯|áº·|áº³|áºµ/g, "a");
    str = str.replace(/Ă¨|Ă©|áº¹|áº»|áº½|Ăª|á»|áº¿|á»‡|á»ƒ|á»…/g, "e");
    str = str.replace(/Ă¬|Ă­|á»‹|á»‰|Ä©/g, "i");
    str = str.replace(/Ă²|Ă³|á»|á»|Ăµ|Ă´|á»“|á»‘|á»™|á»•|á»—|Æ¡|á»|á»›  |á»£|á»Ÿ|á»¡/g, "o");
    str = str.replace(/Ă¹|Ăº|á»¥|á»§|Å©|Æ°|á»«|á»©|á»±|á»­|á»¯/g, "u");
    str = str.replace(/á»³|Ă½|á»µ|á»·|á»¹/g, "y");
    str = str.replace(/Ä‘/g, "d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|-|$|_/g, "_");
    /* tĂ¬m vĂ  thay tháº¿ cĂ¡c kĂ­ tá»± Ä‘áº·c biá»‡t trong chuá»—i sang kĂ­ tá»± - */
    str = str.replace(/_+_/g, "_"); //thay tháº¿ 2- thĂ nh 1-
    str = str.replace(/^\_+|\_+$/g, "");
    //cáº¯t bá» kĂ½ tá»± - á»Ÿ Ä‘áº§u vĂ  cuá»‘i chuá»—i 
    return str;
}
exports.change_alias = change_alias;
