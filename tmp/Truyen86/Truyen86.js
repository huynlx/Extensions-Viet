"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Truyen86 = exports.Truyen86Info = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Truyen86Parser_1 = require("./Truyen86Parser");
const DOMAIN = 'https://truyen86.com/';
const method = 'GET';
exports.Truyen86Info = {
    version: '1.0.0',
    name: 'Truyen86',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyen86',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyen86 extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${DOMAIN}${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: DOMAIN + mangaId,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            let tags = [];
            const genres = [];
            let status = 1;
            let desc = $('.summary-content > p').text();
            for (const t of $('a', '.manga-info > li:nth-of-type(3)').toArray()) {
                const genre = $(t).text().trim();
                const id = (_b = (_a = $(t).attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : genre;
                tags.push(createTag({ label: genre, id }));
                genres.push({
                    label: genre,
                    id
                });
            }
            const image = (_c = $('.info-cover > .thumbnail').attr('src')) !== null && _c !== void 0 ? _c : "fuck";
            const creator = $('a', '.manga-info > li:nth-of-type(2)').text();
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc,
                titles: [$('.manga-info > h3').text()],
                image: image.includes('http') ? image : 'https:' + image,
                status,
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: DOMAIN + mangaId,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(response.rawData)).toString();
            const $ = this.cheerio.load(html);
            const chapters = [];
            var i = 0;
            for (const obj of $(".list-chapters > li").toArray().reverse()) {
                var chapNum = parseFloat($('a > .chapter-name', obj).text().split(' ')[1]);
                i++;
                chapters.push(createChapter({
                    id: $('a', obj).attr('href'),
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: $('a', obj).attr('title'),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: Truyen86Parser_1.convertTime($('.chapter-time', obj).text().trim())
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${DOMAIN}${chapterId}`,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('.chapter-content > img').toArray()) {
                if (!obj.attribs['data-src'])
                    continue;
                let link = obj.attribs['data-src'].trim();
                if (link.includes("https://blogger.googleusercontent.com")) {
                    link = "https://images2-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&gadget=a&no_expand=1&resize_h=0&rewriteMime=image/*&url=" + link;
                }
                else {
                    if (link.includes('http')) {
                        link = link;
                    }
                    else {
                        link = DOMAIN + link;
                    }
                }
                pages.push(encodeURI(link));
            }
            const chapterDetails = createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false
            });
            return chapterDetails;
        });
    }
    getHomePageSections(sectionCallback) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let hot = createHomeSection({
                id: 'hot',
                title: "TRUYỆN HOT TRONG NGÀY",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "TRUYỆN MỚI CẬP NHẬT",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "TRUYỆN MỚI ĐĂNG",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            // Hot
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let popular = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let manga of $('.owl-item', '.owl-stage').toArray()) {
                const title = $('.series-title', manga).text().trim();
                const id = $('.thumb-wrapper > a', manga).attr('href');
                const image = (_a = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).css('background-image')) !== null && _a !== void 0 ? _a : "";
                const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
                const sub = $('.chapter-title > a', manga).text().trim();
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id,
                    image: (bg === null || bg === void 0 ? void 0 : bg.includes('http')) ? (bg) : ("https:" + bg),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: sub }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            //New Updates
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-lg-8.col-sm-8 > .card:nth-child(2) .row-last-update').toArray().splice(0, 15)) {
                const title = $('.series-title', manga).text().trim();
                const id = (_b = $('.series-title > a', manga).attr('href')) !== null && _b !== void 0 ? _b : title;
                const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).attr('data-bg');
                const sub = $('a', manga).last().text().trim();
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? (image) : ("https:" + image),
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //New Added
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-lg-8.col-sm-8 > .card:nth-child(5) .row-last-update').toArray()) {
                const title = $('.series-title', manga).text().trim();
                const id = (_c = $('.series-title > a', manga).attr('href')) !== null && _c !== void 0 ? _c : title;
                const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).attr('data-bg');
                const sub = $('a', manga).last().text().trim();
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? (image) : ("https:" + image),
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newAdded.items = newAddItems;
            sectionCallback(newAdded);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "new_updated":
                    url = DOMAIN + `manga-list.html?page=${page}`;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method,
                param
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = Truyen86Parser_1.parseViewMore($);
            metadata = !Truyen86Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const request = createRequestObject({
                url: query.title ? encodeURI(`${DOMAIN}danh-sach-truyen.html?name=${query.title}&page=${page}`) : `${DOMAIN}${tags[0]}?page=${page}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = Truyen86Parser_1.parseSearch($);
            metadata = !Truyen86Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = DOMAIN;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            const collectedIds = [];
            //the loai
            for (const tag of $('div:not(:last-child) ul.nav', '.megamenu > li').toArray()) {
                for (const gen of $('a', tag).toArray()) {
                    const label = $(gen).text().trim();
                    const id = (_a = $(gen).attr('href')) !== null && _a !== void 0 ? _a : label;
                    if (!id || !label)
                        continue;
                    if (!collectedIds.includes(id)) {
                        arrayTags.push({ id: id, label: label });
                        collectedIds.push(id);
                    }
                }
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: `${DOMAIN}`
        };
    }
}
exports.Truyen86 = Truyen86;
