"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptImages = exports.decodeHTMLEntity = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
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
exports.parseSearch = ($) => {
    var _a;
    const manga = [];
    for (const element of $('li', '#archive-list-table').toArray()) {
        let title = $('.super-title a', element).text().trim();
        let image = (_a = $('img', element).attr('src')) !== null && _a !== void 0 ? _a : "";
        let id = $('.super-title > a', element).first().attr('href');
        // let subtitle = $(`.comic-chapter`, element).text().trim();
        if (!id)
            continue;
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: image.replace('150x150', '300x404'),
            title: createIconText({ text: title }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a, _b;
    const manga = [];
    for (const element of $('.comic-item', '.col-md-9 > .comic-list ').toArray()) {
        let title = $('.comic-title', element).text().trim();
        let image = (_a = $('.img-thumbnail', element).attr('data-thumb')) !== null && _a !== void 0 ? _a : "";
        let id = $('.comic-img > a', element).first().attr('href');
        let subtitle = $(`.comic-chapter`, element).text().trim();
        manga.push(createMangaTile({
            id: id !== null && id !== void 0 ? id : "",
            image: (_b = image.replace('150x150', '300x404')) !== null && _b !== void 0 ? _b : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
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
    const currentPage = Number($("ul.pagination > li.active > span").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
exports.decryptImages = ($, tis) => {
    var CryptoJS = require('crypto-js');
    const pages = [];
    var htmlContent = $.html().match(/htmlContent="(.+)".+text-center post-credit">/)[1].replace(/\\\\/g, '').replace(/\\\"/g, '"'); // => xoá \\ và replace \" thành "
    function CryptoJSAesDecrypt(passphrase, encrypted_json_string) {
        var obj_json = JSON.parse(encrypted_json_string);
        var encrypted = obj_json.ciphertext;
        var salt = CryptoJS.enc.Hex.parse(obj_json.salt);
        var iv = CryptoJS.enc.Hex.parse(obj_json.iv);
        var key = CryptoJS.PBKDF2(passphrase, salt, {
            hasher: CryptoJS.algo.SHA512,
            keySize: 64 / 8,
            iterations: 999
        });
        var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    var chapterHTML = CryptoJSAesDecrypt('EhwuFp' + 'SJkhMV' + 'uUPzrw', htmlContent);
    chapterHTML = chapterHTML.replace(/EhwuFp/g, '.');
    chapterHTML = chapterHTML.replace(/SJkhMV/g, ':');
    chapterHTML = chapterHTML.replace(/uUPzrw/g, '/');
    const $2 = tis.cheerio.load(chapterHTML);
    var cc = $2('img').toArray();
    for (var el in cc) {
        var e = cc[el];
        pages.push($2(e).attr('data-ehwufp'));
    }
    return pages;
};
