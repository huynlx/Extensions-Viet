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
exports.HentaiVL = exports.HentaiVLInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HentaiVLParser_1 = require("./HentaiVLParser");
const DOMAIN = 'https://hentaivl.com/';
const method = 'GET';
exports.HentaiVLInfo = {
    version: '1.0.0',
    name: 'HentaiVL',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVL',
    websiteBaseURL: `https://hentaivl.com/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class HentaiVL extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `https://hentaivl.com${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://hentaivl.com${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.ep-content-story').text();
            for (const t of $('.type_box > .type > a.cate-itm').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            creator = $('.info > p:nth-child(1) > span').text();
            status = $('.info > p:nth-child(4) > span').text().toLowerCase().includes("đang") ? 1 : 0;
            const image = (_b = $('.novel-thumb > img').attr('src')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.title_content > h1').text().trim()],
                image: image,
                status,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: true,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `https://hentaivl.com${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $(".chapter-list > li").toArray().reverse()) {
                i++;
                const getTime = $('span', obj).text().trim().split(/\//);
                const fixDate = [getTime[1], getTime[0], getTime[2]].join('/');
                const finalTime = new Date(fixDate);
                chapters.push(createChapter({
                    id: $('a', obj).first().attr('href'),
                    chapNum: i,
                    name: HentaiVLParser_1.capitalizeFirstLetter($('a', obj).first().text().trim()),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: finalTime
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `https://hentaivl.com${chapterId}`,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('.chapter-content img').toArray()) {
                if (!obj.attribs['data-original'])
                    continue;
                let link = obj.attribs['data-original'].trim();
                pages.push(link);
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
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let hot = createHomeSection({
                id: 'hot',
                title: "TRUYỆN HOT",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "TRUYỆN MỚI CẬP NHẬT",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "TRUYỆN MỚI ĐĂNG",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            //Hot
            let url = '';
            let request = createRequestObject({
                url: 'https://hentaivl.com/',
                method: "GET",
            });
            let hotItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('li', '.list-hot').toArray()) {
                let title = $(`.title`, obj).text().trim();
                let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_a = $('.manga-thumb > a > img', obj).attr('data-original')) !== null && _a !== void 0 ? _a : "";
                let id = (_b = $(`.manga-thumb > a`, obj).attr('href')) !== null && _b !== void 0 ? _b : title;
                hotItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: HentaiVLParser_1.capitalizeFirstLetter(subtitle),
                    }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //New Updates
            url = '';
            request = createRequestObject({
                url: 'https://hentaivl.com/',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(3) > .list_wrap > .slick_item').toArray().splice(0, 20)) {
                let title = $(`h3.title > a`, obj).text().trim();
                let subtitle = $(`.chapter > a`, obj).text();
                const image = $(`.manga-thumb > a > img`, obj).attr('data-original');
                let id = (_c = $(`h3.title > a`, obj).attr('href')) !== null && _c !== void 0 ? _c : title;
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: HentaiVLParser_1.capitalizeFirstLetter(subtitle),
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //New Added
            url = DOMAIN;
            request = createRequestObject({
                url: 'https://hentaivl.com/',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(4) > .list_wrap > .slick_item').toArray().splice(0, 20)) {
                let title = $(`h3.title > a`, obj).text().trim();
                let subtitle = $(`.chapter > a`, obj).text();
                const image = $(`.manga-thumb > a > img`, obj).attr('data-original');
                let id = (_d = $(`h3.title > a`, obj).attr('href')) !== null && _d !== void 0 ? _d : title;
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: HentaiVLParser_1.capitalizeFirstLetter(subtitle),
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
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "hot":
                    url = `https://hentaivl.com/`;
                    select = 0;
                    break;
                case "new_updated":
                    url = `https://hentaivl.com/`;
                    select = 1;
                    break;
                case "new_added":
                    url = `https://hentaivl.com/`;
                    select = 2;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method,
                param: encodeURI(`?page=${page}`)
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            let manga = HentaiVLParser_1.parseViewMore($, select);
            metadata = undefined;
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
                url: encodeURI(`https://hentaivl.com${tags[0] ? tags[0] : ''}`),
                method: "GET",
                param: encodeURI(`?page=${page}`)
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = HentaiVLParser_1.parseSearch($);
            metadata = !HentaiVLParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const url = `https://hentaivl.com/`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            //the loai
            for (const tag of $('a', '#glo_gnb > ul > li:first-child > .sub-menu > li:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = $(tag).attr('href')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            const tagSections = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://hentaivl.com/'
        };
    }
}
exports.HentaiVL = HentaiVL;
