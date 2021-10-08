"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeToSlug = exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
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
exports.parseSearch = ($, query) => {
    const manga = [];
    var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
    if (dt)
        dt = JSON.parse(dt[1]);
    var novels = query.title ? dt.props.pageProps.initialState.search.searchResult.storys : dt.props.pageProps.initialState.classify.comics;
    var el = query.title ? $('.listCon > a').toArray() : $('.classifyList > a').toArray();
    for (var i = 0; i < el.length; i++) {
        var e = el[i];
        manga.push(createMangaTile({
            id: $(e).attr('href'),
            image: novels[i].coverimg,
            title: createIconText({ text: novels[i].title }),
            subtitleText: createIconText({ text: 'Chapter ' + novels[i].chapter_num }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    const manga = [];
    var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
    if (dt)
        dt = JSON.parse(dt[1]);
    var novels = dt.props.pageProps.initialState.more.moreList.list;
    var covers = [];
    novels.forEach((v) => {
        covers.push({
            image: v.coverimg,
            title: v.title,
            chapter: 'Chapter ' + v.chapter_num
        });
    });
    var el = $('.morelistCon a').toArray();
    for (var i = 0; i < el.length; i++) {
        var e = el[i];
        manga.push(createMangaTile({
            id: $(e).attr("href"),
            image: covers[i].image,
            title: createIconText({ text: covers[i].title }),
            subtitleText: createIconText({ text: covers[i].chapter }),
        }));
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("a", ".page_floor").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".page_floor > a.focus").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
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
    //Xóa các ký tự đặt biệt
    slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
    //Đổi khoảng trắng thành ký tự gạch ngang
    slug = slug.replace(/ /gi, "-");
    //Đổi nhiều ký tự gạch ngang liên tiếp thành 1 ký tự gạch ngang
    //Phòng trường hợp người nhập vào quá nhiều ký tự trắng
    slug = slug.replace(/\-\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-/gi, '-');
    slug = slug.replace(/\-\-/gi, '-');
    //Xóa các ký tự gạch ngang ở đầu và cuối
    slug = '@' + slug + '@';
    slug = slug.replace(/\@\-|\-\@|\@/gi, '');
    //In slug ra textbox có id “slug”
    return slug;
}
exports.ChangeToSlug = ChangeToSlug;
