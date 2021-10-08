"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.parsePopularSections = exports.parseAddedSections = exports.parseRandomSections = exports.parseHomeSections = exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const entities = require("entities"); //Import package for decoding HTML entities
exports.parseMangaDetails = ($, mangaId) => {
    var _a;
    let tags = [];
    let creator = '';
    let status = 1; //completed, 1 = Ongoing
    let desc = '';
    for (const obj of $('p', '.page-info').toArray()) {
        switch ($('span.info:first-child', obj).text().trim()) {
            case "Thể Loại:":
                for (const genres of $('span:not(.info)', obj).toArray()) {
                    const genre = $('a', genres).text().trim();
                    const id = (_a = $('a', genres).attr('href')) !== null && _a !== void 0 ? _a : genre;
                    tags.push(createTag({ id: id, label: genre }));
                }
                break;
            case "Tác giả:":
                creator = $('span:nth-child(2) > a', obj).text();
                break;
            case "Tình Trạng:":
                status = $('span:nth-child(2) > a', obj).text().toLowerCase().includes("đã hoàn thành") ? 0 : 1;
                break;
            case "Nội dung:":
                desc = desc = $(obj).next().text();
                break;
        }
    }
    return createManga({
        id: mangaId.split("::")[0],
        author: creator,
        artist: creator,
        desc: desc === "" ? 'Không có mô tả' : desc,
        titles: [$('.page-info > h1').text().trim()],
        image: encodeURI(mangaId.split("::")[1].replace('190', '300').trim()),
        status,
        hentai: true,
        tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
    });
};
exports.parseChapters = ($, mangaId) => {
    var _a;
    const chapters = [];
    var i = 0;
    for (const obj of $(".listing tr").toArray().reverse()) {
        i++;
        const name = ($("td:first-child > a > h2", obj).text().trim());
        const id = (_a = $('td:first-child > a', obj).attr('href').split('/').pop()) !== null && _a !== void 0 ? _a : "";
        const time = $("td:last-child", obj).text().trim().split(/\//);
        const finalTime = new Date([time[1], time[0], time[2]].join('/'));
        if (id == "")
            continue;
        const chapterNumber = i;
        chapters.push(createChapter({
            id: encodeURIComponent(id),
            chapNum: chapterNumber,
            name,
            mangaId: mangaId.split("::")[0],
            langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
            time: finalTime
        }));
    }
    return chapters;
};
exports.parseChapterDetails = ($, mangaId, chapterId) => {
    const pages = [];
    for (let obj of $('div#image > img').toArray()) {
        if (!obj.attribs['src'])
            continue;
        let link = obj.attribs['src'];
        pages.push(link);
    }
    const chapterDetails = createChapterDetails({
        id: chapterId,
        mangaId: mangaId.split("::")[0],
        pages: pages,
        longStrip: false
    });
    return chapterDetails;
};
exports.parseHomeSections = ($, sections, sectionCallback) => {
    var _a, _b;
    for (const section of sections)
        sectionCallback(section);
    //featured
    let featured = [];
    for (let manga of $('li', '.block-top').toArray()) {
        const title = $('.box-description h2', manga).first().text();
        const id = (_a = $('a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        const image = $('a > div', manga).css('background');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        const subtitle = $(".info-detail", manga).last().text().trim();
        if (!id || !title)
            continue;
        featured.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + bg,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[0].items = featured;
    sectionCallback(sections[0]);
    //Recently Updated
    let staffPick = [];
    for (let manga of $('ul', 'ul.page-item').toArray()) {
        const title = $('span > a > h2', manga).first().text();
        const id = (_b = $('a', manga).attr('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop();
        const image = $('a > div', manga).css('background');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        const subtitle = $("a > span > b", manga).last().text().trim();
        if (!id || !title)
            continue;
        staffPick.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + bg,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[2].items = staffPick;
    sectionCallback(sections[2]);
};
exports.parseRandomSections = ($, sections, sectionCallback) => {
    var _a;
    //Random
    let random = [];
    for (let manga of $('li', '.page-random').toArray()) {
        const title = $('.des-same > a > b', manga).text();
        const id = (_a = $('.img-same > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        const image = $('.img-same > a > div', manga).css('background');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        const subtitle = $("b", manga).last().text().trim();
        if (!id || !title)
            continue;
        random.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + bg,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[1].items = random;
    sectionCallback(sections[1]);
};
exports.parseAddedSections = ($, sections, sectionCallback) => {
    var _a;
    //Recently Added
    let added = [];
    for (let manga of $('.item', '.block-item').toArray()) {
        const title = $('.box-description > p > a', manga).text();
        const id = (_a = $('.box-cover > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        const image = $('.box-cover > a > img', manga).attr('data-src');
        const subtitle = $(".box-description p:nth-child(1)", manga).text().trim();
        const fixsub = subtitle.split('-')[1];
        if (!id || !title)
            continue;
        added.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + image,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: fixsub.trim() }),
        }));
    }
    sections[4].items = added;
    sectionCallback(sections[4]);
};
exports.parsePopularSections = ($, sections, sectionCallback) => {
    var _a;
    //popular
    let popular = [];
    for (let manga of $('.item', '.block-item').toArray()) {
        const title = $('.box-description > p > a', manga).text();
        const id = (_a = $('.box-cover > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        const image = $('.box-cover > a > img', manga).attr('data-src');
        const subtitle = $(".box-description p:nth-child(1)", manga).text().trim();
        const fixsub = subtitle.split('-')[1];
        if (!id || !title)
            continue;
        popular.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + image,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: fixsub.trim() }),
        }));
    }
    sections[3].items = popular;
    sectionCallback(sections[3]);
};
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a;
    const mangas = [];
    for (let manga of $('.item', '.block-item').toArray()) {
        const title = $('.box-description > p > a', manga).text();
        const id = (_a = $('.box-cover > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        const image = $('.box-cover > a > img', manga).attr('data-src');
        const subtitle = $(".box-description p:nth-child(1)", manga).text().trim();
        const fixsub = subtitle.split('-')[1];
        if (!id || !title)
            continue;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + image,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.trim()),
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: fixsub.trim() }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($, select) => {
    var _a, _b;
    const manga = [];
    const collectedIds = [];
    if (select === 1) {
        for (const obj of $(".item", "ul").toArray()) {
            const title = $("span > a > h2", obj).text();
            const id = (_a = $("a", obj).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $("a > img", obj).attr('data-src');
            const subtitle = $("a > span > b", obj).text().trim();
            if (!id || !title)
                continue;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id: encodeURIComponent(id) + "::" + image,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        }
    }
    else {
        for (let obj of $('.item', '.block-item').toArray()) {
            const title = $('.box-description > p > a', obj).text();
            const id = (_b = $('.box-cover > a', obj).attr('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop();
            const image = $('.box-cover > a > img', obj).attr('data-src');
            const subtitle = $(".box-description p:nth-child(1)", obj).text().trim();
            const fixsub = subtitle.split('-')[1];
            if (!id || !title)
                continue;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id: encodeURIComponent(id) + "::" + image,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: fixsub.trim() }),
                }));
            }
            collectedIds.push(id);
        }
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
    const currentPage = Number($("li > b").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
