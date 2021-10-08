"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
class Parser {
    convertTime(timeAgo) {
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
                let split = timeAgo.split('/'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time;
    }
    parseMangaDetails($, mangaId) {
        var _a, _b;
        let tags = [];
        for (let obj of $('li.kind > p.col-xs-8 > a').toArray()) {
            const label = $(obj).text();
            const id = (_b = (_a = $(obj).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[4]) !== null && _b !== void 0 ? _b : label;
            tags.push(createTag({
                label: label,
                id: id,
            }));
        }
        const creator = $('ul.list-info > li.author > p.col-xs-8').text();
        const image = $('div.col-image > img').attr('src');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: $('div.detail-content > p').text(),
            titles: [$('h1.title-detail').text()],
            image: image !== null && image !== void 0 ? image : '',
            status: $('li.status > p.col-xs-8').text().toLowerCase().includes("hoàn thành") ? 0 : 1,
            rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
        });
    }
    parseChapterList($, mangaId) {
        const chapters = [];
        for (let obj of $('div.list-chapter > nav > ul > li.row:not(.heading)').toArray()) {
            let time = $('div.col-xs-4', obj).text();
            let timeFinal = this.convertTime(time);
            chapters.push(createChapter({
                id: $('div.chapter a', obj).attr('href'),
                chapNum: parseFloat($('div.chapter a', obj).text().split(' ')[1]),
                name: $('div.chapter a', obj).text(),
                mangaId: mangaId,
                langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                time: timeFinal
            }));
        }
        return chapters;
    }
    parseChapterDetails($) {
        const pages = [];
        for (let obj of $('div.reading-detail > div.page-chapter > img').toArray()) {
            if (!obj.attribs['data-original'])
                continue;
            let link = obj.attribs['data-original'];
            if (link.indexOf('http') === -1) { //nếu link ko có 'http'
                pages.push('http:' + obj.attribs['data-original']);
            }
            else {
                pages.push(link);
            }
        }
        return pages;
    }
    parseSearchResults($) {
        var _a;
        const tiles = [];
        for (const manga of $('div.item', 'div.row').toArray()) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                continue;
            tiles.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        return tiles;
    }
    parseTags($) {
        var _a, _b, _c, _d, _e;
        //id tag đéo đc trùng nhau
        const arrayTags = [];
        const arrayTags2 = [];
        const arrayTags3 = [];
        const arrayTags4 = [];
        const arrayTags5 = [];
        //The loai
        for (const tag of $('div.col-md-3.col-sm-4.col-xs-6.mrb10', 'div.col-sm-10 > div.row').toArray()) {
            const label = $('div.genre-item', tag).text().trim();
            const id = (_a = $('div.genre-item > span', tag).attr('data-id')) !== null && _a !== void 0 ? _a : label;
            if (!id || !label)
                continue;
            arrayTags.push({ id: id, label: label });
        }
        //Số lượng chapter
        for (const tag of $('option', 'select.select-minchapter').toArray()) {
            const label = $(tag).text().trim();
            const id = (_b = 'minchapter.' + $(tag).attr('value')) !== null && _b !== void 0 ? _b : label;
            if (!id || !label)
                continue;
            arrayTags2.push({ id: id, label: label });
        }
        //Tình trạng
        for (const tag of $('option', '.select-status').toArray()) {
            const label = $(tag).text().trim();
            const id = (_c = 'status.' + $(tag).attr('value')) !== null && _c !== void 0 ? _c : label;
            if (!id || !label)
                continue;
            arrayTags3.push({ id: id, label: label });
        }
        //Dành cho
        for (const tag of $('option', '.select-gender').toArray()) {
            const label = $(tag).text().trim();
            const id = (_d = 'gender.' + $(tag).attr('value')) !== null && _d !== void 0 ? _d : label;
            if (!id || !label)
                continue;
            arrayTags4.push({ id: id, label: label });
        }
        //Sắp xếp theo
        for (const tag of $('option', '.select-sort').toArray()) {
            const label = $(tag).text().trim();
            const id = (_e = 'sort.' + $(tag).attr('value')) !== null && _e !== void 0 ? _e : label;
            if (!id || !label)
                continue;
            arrayTags5.push({ id: id, label: label });
        }
        const tagSections = [createTagSection({ id: '0', label: 'Thể Loại (Có thể chọn nhiều hơn 1)', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Số Lượng Chapter (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Dành Cho (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Sắp xếp theo (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
        ];
        return tagSections;
    }
    parseFeaturedSection($) {
        var _a;
        let featuredItems = [];
        for (let manga of $('div.item', 'div.altcontent1').toArray()) {
            const title = $('.slide-caption > h3 > a', manga).text();
            const id = (_a = $('a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('a > img.lazyOwl', manga).attr('data-src');
            const subtitle = $('.slide-caption > a', manga).text().trim() + ' - ' + $('.slide-caption > .time', manga).text().trim();
            if (!id || !title)
                continue;
            featuredItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }));
        }
        return featuredItems;
    }
    parsePopularSection($) {
        var _a;
        let viewestItems = [];
        for (let manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                continue;
            viewestItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        return viewestItems;
    }
    parseHotSection($) {
        var _a;
        const TopWeek = [];
        for (const manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                continue;
            TopWeek.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        return TopWeek;
    }
    parseNewUpdatedSection($) {
        var _a;
        let newUpdatedItems = [];
        for (let manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        return newUpdatedItems;
    }
    parseNewAddedSection($) {
        var _a;
        let newAddedItems = [];
        for (let manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                continue;
            newAddedItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        return newAddedItems;
    }
    parseViewMoreItems($) {
        var _a;
        const mangas = [];
        const collectedIds = [];
        for (const manga of $('div.item', 'div.row').toArray()) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                continue;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                mangas.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        }
        return mangas;
    }
}
exports.Parser = Parser;
