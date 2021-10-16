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
exports.VietComic = exports.VietComicInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const VietComicParser_1 = require("./VietComicParser");
const DOMAIN = 'https://vietcomic.net/';
const method = 'GET';
exports.VietComicInfo = {
    version: '1.0.0',
    name: 'VietComic',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from VietComic',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class VietComic extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $(".manga-info-content").text().replace('NỘI DUNG :', '').trim();
            // console.log(desc);
            for (const tt of $('.manga-info-text > li').toArray()) {
                if ($(tt).text().includes('Tình Trạng')) {
                    status = $(tt).text().split(":")[1].includes("Đang") ? 1 : 0;
                }
                else if ($(tt).text().includes('Tác Giả')) {
                    creator = $(tt).text().split(":")[1].trim();
                }
                else if ($(tt).text().includes('Thể Loại')) {
                    for (const t of $('a', tt).toArray()) {
                        const genre = $(t).text().trim();
                        const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                        tags.push(createTag({ label: genre, id }));
                    }
                }
            }
            const image = $(".manga-info-pic img").first().attr('src');
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc !== null && desc !== void 0 ? desc : "đéo có des rồi",
                titles: [$(".manga-info-text h1").first().text()],
                image: image !== null && image !== void 0 ? image : "",
                status,
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            var el = $(".chapter-list span:nth-child(1) > a").toArray().reverse();
            const chapters = [];
            var i = 0;
            for (var i = el.length - 1; i >= 0; i--) {
                var e = el[i];
                chapters.push(createChapter({
                    id: $(e).attr("href"),
                    chapNum: i + 1,
                    name: $(e).text().trim(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${chapterId}`,
                method
            });
            const regex = /data = '(.+)'/g;
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const arr = regex.exec($.html());
            const images = (_a = arr === null || arr === void 0 ? void 0 : arr[1].split('|')) !== null && _a !== void 0 ? _a : [];
            const pages = [];
            for (var i = 0; i < images.length; i++) {
                pages.push('https://proxy.duckduckgo.com/iu/?u=' + images[i]);
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let az = createHomeSection({
                id: 'az',
                title: "A-Z",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Lượt xem",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện HOT",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Siêu phẩm",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(az);
            sectionCallback(view);
            sectionCallback(hot);
            sectionCallback(newAdded);
            sectionCallback(newUpdated);
            ///Get the section data
            //az
            let request = createRequestObject({
                url: 'https://vietcomic.net/truyen-tranh-hay',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            az.items = VietComicParser_1.parseManga($);
            sectionCallback(az);
            //View
            request = createRequestObject({
                url: 'https://vietcomic.net/truyen-tranh-hay?type=truyenhay',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            view.items = VietComicParser_1.parseManga($);
            sectionCallback(view);
            //Hot
            request = createRequestObject({
                url: 'https://vietcomic.net/truyen-tranh-hay?type=hot',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            hot.items = VietComicParser_1.parseManga($);
            sectionCallback(hot);
            //New Added
            request = createRequestObject({
                url: 'https://vietcomic.net/truyen-tranh-hay?type=sieu-pham',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            newAdded.items = VietComicParser_1.parseManga($);
            sectionCallback(newAdded);
            //New Updates
            request = createRequestObject({
                url: 'https://vietcomic.net/truyen-tranh-hay?type=truyenmoi',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            newUpdated.items = VietComicParser_1.parseManga($);
            sectionCallback(newUpdated);
            //Featured
            request = createRequestObject({
                url: 'https://vietcomic.net/',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            const featuredItems = [];
            for (const x of $('.slide .item').toArray().splice(0, 10)) {
                featuredItems.push(createMangaTile({
                    id: (_a = $('.slide-caption > h3 > a', x).attr("href")) !== null && _a !== void 0 ? _a : "",
                    image: (_b = $('img', x).attr("src")) !== null && _b !== void 0 ? _b : "",
                    title: createIconText({
                        text: $('.slide-caption > h3 > a', x).text(),
                    }),
                    subtitleText: createIconText({
                        text: $('.slide-caption > a', x).text(),
                    }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "hot":
                    url = `https://vietcomic.net/truyen-tranh-hay?type=hot&page=${page}`;
                    break;
                case "new_updated":
                    url = `https://vietcomic.net/truyen-tranh-hay?type=truyenmoi&page=${page}`;
                    break;
                case "new_added":
                    url = `https://vietcomic.net/truyen-tranh-hay?type=sieu-pham&page=${page}`;
                    break;
                case "az":
                    url = `https://vietcomic.net/truyen-tranh-hay?type=az&page=${page}`;
                    break;
                case "view":
                    url = `https://vietcomic.net/truyen-tranh-hay?type=truyenhay&page=${page}`;
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
            const manga = VietComicParser_1.parseViewMore($);
            metadata = !VietComicParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const request = createRequestObject({
                url: query.title ? encodeURI(`https://vietcomic.net/api/searchStory/${query.title}`) :
                    tags[0] + `&page=${page}`,
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let tiles = [];
            if (query.title) {
                let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
                // console.log(json);
                const items = [];
                for (const x of json) {
                    items.push(createMangaTile({
                        id: 'https://vietcomic.net/' + VietComicParser_1.change_alias((_d = x.name) !== null && _d !== void 0 ? _d : "") + "-" + ((_e = x.id) !== null && _e !== void 0 ? _e : ""),
                        image: 'https://vietcomic.net' + ((_f = x.image) !== null && _f !== void 0 ? _f : ""),
                        title: createIconText({
                            text: (_g = x.name) !== null && _g !== void 0 ? _g : "",
                        }),
                        subtitleText: createIconText({
                            text: (_h = x.chapter_lastname) !== null && _h !== void 0 ? _h : "",
                        }),
                    }));
                }
                tiles = items;
            }
            else {
                let $ = this.cheerio.load(data.data);
                tiles = VietComicParser_1.parseSearch($);
            }
            if (query.title) {
                metadata = undefined;
            }
            else {
                let $ = this.cheerio.load(data.data);
                metadata = !VietComicParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            }
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
            const request = createRequestObject({
                url: 'https://vietcomic.net/',
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            var gen = $('.tag-name > li > a').toArray();
            for (const i of gen) {
                tags.push({
                    id: (_a = $(i).attr('href')) !== null && _a !== void 0 ? _a : "",
                    label: $(i).text()
                });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: DOMAIN
        };
    }
}
exports.VietComic = VietComic;
