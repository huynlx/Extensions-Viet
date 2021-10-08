"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ucFirstAllWords = exports.parseManga = exports.decodeHTMLEntity = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a, _b, _c;
    var element = $(".thumb").toArray();
    const mangas = [];
    for (var el in element) { // in => index, of => element
        var book = element[el];
        var checkCover = $("img", book).attr("style");
        var cover = '';
        if ((checkCover === null || checkCover === void 0 ? void 0 : checkCover.indexOf('jpg')) != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = (_b = (_a = checkCover === null || checkCover === void 0 ? void 0 : checkCover.match(/image: url\('\/\/(.+)\'\)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ""; //regex
        else
            cover = "";
        mangas.push(createMangaTile({
            id: (_c = $("a.name", book).attr("href")) !== null && _c !== void 0 ? _c : "",
            image: "https://" + cover,
            title: createIconText({
                text: $("a.name", book).text().replace("T MỚI ", "").trim(),
            }),
            subtitleText: createIconText({
                text: $("a.chap", book).text().replace("C MỚI ", "").trim(),
            }),
            badge: 10,
            primaryText: createIconText({
                text: 'huynh',
            }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a, _b, _c;
    var element = $(".thumb").toArray();
    const mangas = [];
    for (var el in element) { // in => index, of => element
        var book = element[el];
        var checkCover = $("img", book).attr("style");
        var cover = '';
        if ((checkCover === null || checkCover === void 0 ? void 0 : checkCover.indexOf('jpg')) != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = (_b = (_a = checkCover === null || checkCover === void 0 ? void 0 : checkCover.match(/image: url\('\/\/(.+)\'\)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ""; //regex
        else
            cover = "";
        mangas.push(createMangaTile({
            id: (_c = $("a.name", book).attr("href")) !== null && _c !== void 0 ? _c : "",
            image: "https://" + cover,
            title: createIconText({
                text: $("a.name", book).text().replace("T MỚI ", "").trim(),
            }),
            subtitleText: createIconText({
                text: $("a.chap", book).text().replace("C MỚI ", "").trim(),
            }),
            badge: 10,
            primaryText: createIconText({
                text: 'huynh',
            }),
        }));
    }
    return mangas;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
exports.parseManga = ($) => {
    var _a, _b, _c;
    var element = $(".thumb").toArray().splice(0, 20);
    const mangas = [];
    for (var el in element) { // in => index, of => element
        var book = element[el];
        var checkCover = $("img", book).attr("style");
        var cover = '';
        if ((checkCover === null || checkCover === void 0 ? void 0 : checkCover.indexOf('jpg')) != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = (_b = (_a = checkCover === null || checkCover === void 0 ? void 0 : checkCover.match(/image: url\('\/\/(.+)\'\)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ""; //regex
        else
            cover = "";
        mangas.push(createMangaTile({
            id: (_c = $("a.name", book).attr("href")) !== null && _c !== void 0 ? _c : "",
            image: "https://" + cover,
            title: createIconText({
                text: $("a.name", book).text().replace("T MỚI ", "").trim(),
            }),
            subtitleText: createIconText({
                text: $("a.chap", book).text().replace("C MỚI ", "").trim(),
            }),
            badge: 10,
            primaryText: createIconText({
                text: 'huynh',
            }),
        }));
    }
    return mangas;
};
function ucFirstAllWords(str) {
    var pieces = str.split(" ");
    for (var i = 0; i < pieces.length; i++) {
        var j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    }
    return pieces.join(" ");
}
exports.ucFirstAllWords = ucFirstAllWords;
