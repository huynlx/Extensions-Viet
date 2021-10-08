"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTime = exports.decodeHTMLEntity = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
const entities = require("entities"); //Import package for decoding HTML entities
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = (json) => {
    var _a, _b;
    const mangas = [];
    const array = (_a = json.result.data) !== null && _a !== void 0 ? _a : json.result;
    for (let obj of array) {
        let title = obj.name;
        let subtitle = 'Chương ' + obj.chapterLatest[0];
        const image = obj.photo;
        let id = 'https://goctruyentranh.com/truyen/' + obj.nameEn + "::" + obj.id;
        mangas.push(createMangaTile({
            id: id,
            image: (_b = encodeURI(image)) !== null && _b !== void 0 ? _b : "",
            title: createIconText({ text: exports.decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = (json) => {
    var _a;
    const manga = [];
    const collectedIds = [];
    for (let obj of json.result.data) {
        let title = obj.name;
        let subtitle = 'Chương ' + obj.chapterLatest[0];
        const image = obj.photo;
        let id = 'https://goctruyentranh.com/truyen/' + obj.nameEn + "::" + obj.id;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: id,
                image: (_a = encodeURI(image)) !== null && _a !== void 0 ? _a : "",
                title: createIconText({ text: exports.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
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
        time = new Date(Date.now() - trimmed * 31556952000);
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
            let split = timeAgo.split('-'); //vd => 05/12/18
            time = new Date(split[1] + '/' + split[0] + '/' + split[2]);
        }
    }
    return time;
}
exports.convertTime = convertTime;
