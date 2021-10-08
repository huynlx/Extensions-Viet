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
exports.NetTruyen = exports.NetTruyenInfo = exports.isLastPage = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NetTruyenParser_1 = require("./NetTruyenParser");
const DOMAIN = 'http://www.nettruyenpro.com/';
exports.isLastPage = ($) => {
    const current = $('ul.pagination > li.active > a').text();
    let total = $('ul.pagination > li.PagerSSCCells:last-child').text();
    if (current) {
        total = total !== null && total !== void 0 ? total : '';
        return (+total) === (+current); //+ => convert value to number
    }
    return true;
};
exports.NetTruyenInfo = {
    version: '3.0.0',
    name: 'NetTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from NetTruyen.',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        },
    ]
};
class NetTruyen extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new NetTruyenParser_1.Parser();
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${DOMAIN}truyen-tranh/${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}truyen-tranh/${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            return this.parser.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}truyen-tranh/${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            return this.parser.parseChapterList($, mangaId);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: chapterId,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const pages = this.parser.parseChapterDetails($);
            return createChapterDetails({
                pages: pages,
                longStrip: false,
                id: chapterId,
                mangaId: mangaId,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const search = {
                genres: '',
                gender: "-1",
                status: "-1",
                minchapter: "1",
                sort: "0"
            };
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const genres = [];
            tags.map((value) => {
                if (value.indexOf('.') === -1) {
                    genres.push(value);
                }
                else {
                    switch (value.split(".")[0]) {
                        case 'minchapter':
                            search.minchapter = (value.split(".")[1]);
                            break;
                        case 'gender':
                            search.gender = (value.split(".")[1]);
                            break;
                        case 'sort':
                            search.sort = (value.split(".")[1]);
                            break;
                        case 'status':
                            search.status = (value.split(".")[1]);
                            break;
                    }
                }
            });
            search.genres = (genres !== null && genres !== void 0 ? genres : []).join(",");
            const url = `${DOMAIN}`;
            const request = createRequestObject({
                url: query.title ? (url + '/tim-truyen') : (url + '/tim-truyen-nang-cao'),
                method: "GET",
                param: encodeURI(`?keyword=${(_d = query.title) !== null && _d !== void 0 ? _d : ''}&genres=${search.genres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}&page=${page}`)
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = this.parser.parseSearchResults($);
            metadata = !exports.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let viewest = createHomeSection({
                id: 'viewest',
                title: "Truyện Xem Nhiều Nhất",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Hot Nhất",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện Mới Cập Nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện Mới Thêm Gần Đây",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(featured);
            sectionCallback(viewest);
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            //Featured
            let url = `${DOMAIN}`;
            let request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            featured.items = this.parser.parseFeaturedSection($);
            sectionCallback(featured);
            //View
            url = `${DOMAIN}tim-truyen?status=-1&sort=10`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            viewest.items = this.parser.parsePopularSection($);
            sectionCallback(viewest);
            //Hot
            url = `${DOMAIN}hot`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            hot.items = this.parser.parseHotSection($);
            sectionCallback(hot);
            //New Updates
            url = `${DOMAIN}`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            newUpdated.items = this.parser.parseNewUpdatedSection($);
            sectionCallback(newUpdated);
            //New added
            url = `${DOMAIN}tim-truyen?status=-1&sort=15`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            newAdded.items = this.parser.parseNewAddedSection($);
            sectionCallback(newAdded);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = "";
            let url = "";
            switch (homepageSectionId) {
                case "viewest":
                    param = `?status=-1&sort=10&page=${page}`;
                    url = `${DOMAIN}tim-truyen`;
                    break;
                case "hot":
                    param = `?page=${page}`;
                    url = `${DOMAIN}hot`;
                    break;
                case "new_updated":
                    param = `?page=${page}`;
                    url = DOMAIN;
                    break;
                case "new_added":
                    param = `?status=-1&sort=15&page=${page}`;
                    url = `${DOMAIN}tim-truyen`;
                    break;
                default:
                    throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
            }
            const request = createRequestObject({
                url,
                method: 'GET',
                param,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = this.parser.parseViewMoreItems($);
            ;
            metadata = exports.isLastPage($) ? undefined : { page: page + 1 };
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}tim-truyen-nang-cao`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return this.parser.parseTags($);
        });
    }
    // async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
    //     const request = createRequestObject({
    //         url: DOMAIN,
    //         headers: { 'content-type': 'application/x-www-form-urlencoded' },
    //         method: 'GET',
    //     })
    //     const response = await this.requestManager.schedule(request, 1)
    //     const returnObject = this.parser.parseUpdatedManga(response.data, time, ids)
    //     mangaUpdatesFoundCallback(createMangaUpdates(returnObject))
    // }
    globalRequestHeaders() {
        return {
            referer: DOMAIN
        };
    }
}
exports.NetTruyen = NetTruyen;
