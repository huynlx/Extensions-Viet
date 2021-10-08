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
exports.HorrorFC = exports.HorrorFCInfo = exports.isLastPage = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HorrorFCParser_1 = require("./HorrorFCParser");
const DOMAIN = 'https://horrorfc.net/';
exports.isLastPage = ($) => {
    return true;
};
exports.HorrorFCInfo = {
    version: '1.0.0',
    name: 'HorrorFC',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HorrorFC.',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        },
        {
            text: "Horror",
            type: paperback_extensions_common_1.TagType.RED
        }
    ]
};
class HorrorFC extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new HorrorFCParser_1.Parser();
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${mangaId.split("::")[0]}`; }
    ;
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${mangaId.split("::")[0]}`;
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
            const url = `${mangaId.split("::")[0]}`;
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
                mangaId: mangaId.split("::")[0],
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const tags = (_b = (_a = query.includedTags) === null || _a === void 0 ? void 0 : _a.map(tag => tag.id)) !== null && _b !== void 0 ? _b : [];
            var tiles = [];
            if (query.title) {
                tiles = [];
            }
            else {
                const request = createRequestObject({
                    url: encodeURI(tags[0]),
                    method: "GET"
                });
                const data = yield this.requestManager.schedule(request, 1);
                let $ = this.cheerio.load(data.data);
                tiles = this.parser.parseSearch($);
            }
            metadata = undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let viewest = createHomeSection({
                id: 'viewest',
                title: "Projects",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(viewest);
            ///Get the section data
            //View
            let url = `${DOMAIN}`;
            let request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            viewest.items = this.parser.parsePopularSection($);
            sectionCallback(viewest);
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
                    url = DOMAIN;
                    param = `?page=${page}`;
                    break;
                default:
                    throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
            }
            const request = createRequestObject({
                url,
                method: 'GET',
                param
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = this.parser.parseViewMoreItems($);
            metadata = exports.isLastPage($) ? undefined : { page: page + 1 };
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let count = $('a.item > span:nth-child(2)').text().trim();
            const tags = [{ 'id': 'https://horrorfc.net/', 'label': 'Tất Cả (' + count + ')' }];
            const tagSections = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: DOMAIN
        };
    }
}
exports.HorrorFC = HorrorFC;
