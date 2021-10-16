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
exports.Truyendoc = exports.TruyendocInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyendocParser_1 = require("./TruyendocParser");
const DOMAIN = 'http://truyendoc.info/';
const method = 'GET';
exports.TruyendocInfo = {
    version: '1.0.0',
    name: 'Truyendoc',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyendoc',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyendoc extends paperback_extensions_common_1.Source {
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
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: encodeURI(mangaId),
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let status = 1;
            let desc = $('#PlaceHolderLeft_mP_Description').text();
            for (const t of $('#PlaceHolderLeft_mP_Kind a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_b = (_a = $(t).attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_c = $('.manga-cover img').attr('src')) !== null && _c !== void 0 ? _c : "fuck";
            const creator = $('#PlaceHolderLeft_mA_Actor').text().trim();
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc,
                titles: [$('#PlaceHolderLeft_mH1_TitleComic').text()],
                image: (image),
                status,
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: encodeURI(mangaId),
                method,
            });
            var i = 0;
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            for (const obj of $(".list_chapter a").toArray().reverse()) {
                i++;
                var chapNum = parseFloat($(obj).text().split(' ').pop());
                chapters.push(createChapter({
                    id: 'http://truyendoc.info' + $(obj).attr('href'),
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: $(obj).text(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: encodeURI(chapterId),
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('#ContentPlaceDetail_mDivMain > img').toArray()) {
                let link = obj.attribs['data-original'].trim();
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
                title: "Truyện Hot",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện Tranh Mới Nhất",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện Tranh Full",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            sectionCallback(hot);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'http://truyendoc.info/tinh-nang/truyen-moi-nhat',
                method: "GET",
            });
            let newUpdatedItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let manga of $('.list_comic > .left').toArray()) {
                const title = $('h2', manga).text().trim();
                const id = (_a = $('.thumbnail > a', manga).attr('href')) !== null && _a !== void 0 ? _a : title;
                const image = $('.thumbnail img', manga).attr('src');
                const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
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
                url: 'http://truyendoc.info/truyen-du-bo',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.list_comic > .left').toArray()) {
                const title = $('h2', manga).text().trim();
                const id = (_b = $('.thumbnail > a', manga).attr('href')) !== null && _b !== void 0 ? _b : title;
                const image = $('.thumbnail img', manga).attr('src');
                const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
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
            // Hot
            request = createRequestObject({
                url: 'http://truyendoc.info/truyen-xem-nhieu',
                method: "GET",
            });
            let popular = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.list_comic > .left').toArray()) {
                const title = $('h2', manga).text().trim();
                const id = (_c = $('.thumbnail > a', manga).attr('href')) !== null && _c !== void 0 ? _c : title;
                const image = $('.thumbnail img', manga).attr('src');
                const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: sub }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
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
                    url = `http://truyendoc.info/tinh-nang/truyen-moi-nhat/${page}`;
                    break;
                case "new_added":
                    url = `http://truyendoc.info/truyen-du-bo/trang-${page}`;
                    break;
                case "hot":
                    url = `http://truyendoc.info/truyen-xem-nhieu/${page}`;
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
            const manga = TruyendocParser_1.parseViewMore($);
            metadata = !TruyendocParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI(`http://truyendoc.info/tinh-nang/tim-kiem/${query.title}/${page}`) : `${tags[0]}/${page}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = TruyendocParser_1.parseSearch($);
            metadata = !TruyendocParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
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
            for (const tag of $('.ul_submenu a').toArray()) {
                arrayTags.push({ id: $(tag).attr('href'), label: $(tag).text().trim() });
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
exports.Truyendoc = Truyendoc;
