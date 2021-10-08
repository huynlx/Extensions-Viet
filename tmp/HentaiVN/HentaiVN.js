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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HentaiVN = exports.HentaiVNInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HentaiVNParser_1 = require("./HentaiVNParser");
const tags_json_1 = __importDefault(require("./tags.json"));
const DOMAIN = `https://hentaivn.tv/`;
const method = 'GET';
exports.HentaiVNInfo = {
    version: '2.7.0',
    name: 'HentaiVN',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVN',
    websiteBaseURL: '',
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class HentaiVN extends paperback_extensions_common_1.Source {
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
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${DOMAIN}`,
                method,
                param: mangaId.split("::")[0],
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return HentaiVNParser_1.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${DOMAIN}`,
                method,
                param: mangaId.split("::")[0],
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return HentaiVNParser_1.parseChapters($, mangaId);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${DOMAIN}`,
                method,
                param: chapterId,
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            return HentaiVNParser_1.parseChapterDetails($, mangaId, chapterId);
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const section0 = createHomeSection({ id: 'featured', title: 'Tiêu điểm', type: paperback_extensions_common_1.HomeSectionType.featured });
            const section5 = createHomeSection({ id: 'random', title: 'Truyện ngẫu nhiên', view_more: false });
            const section1 = createHomeSection({ id: 'recently-updated', title: 'Mới cập nhật', view_more: true });
            const section2 = createHomeSection({ id: 'popular', title: 'Tiêu điểm', view_more: true });
            const section3 = createHomeSection({ id: 'recently_added', title: 'Truyện mới đăng', view_more: true });
            const sections = [section0, section5, section1, section2, section3];
            let request = createRequestObject({
                url: `${DOMAIN}`,
                method,
            });
            let response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            HentaiVNParser_1.parseHomeSections($, sections, sectionCallback);
            //random
            request = createRequestObject({
                url: DOMAIN + 'list-random.php',
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            });
            response = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(response.data);
            HentaiVNParser_1.parseRandomSections($, sections, sectionCallback);
            //added
            request = createRequestObject({
                url: `${DOMAIN}danh-sach.html`,
                method,
            });
            response = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(response.data);
            HentaiVNParser_1.parseAddedSections($, sections, sectionCallback);
            //popular
            request = createRequestObject({
                url: `${DOMAIN}tieu-diem.html`,
                method,
            });
            response = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(response.data);
            HentaiVNParser_1.parsePopularSections($, sections, sectionCallback);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let select = 1;
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "recently-updated":
                    url = `${DOMAIN}`;
                    param = `?page=${page}`;
                    select = 1;
                    break;
                case "recently_added":
                    url = `${DOMAIN}danh-sach.html`;
                    param = `?page=${page}`;
                    select = 2;
                    break;
                case "popular":
                    url = `${DOMAIN}tieu-diem.html`;
                    param = `?page=${page}`;
                    select = 3;
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
            const manga = HentaiVNParser_1.parseViewMore($, select);
            metadata = !HentaiVNParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const tag = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            var url = '';
            if (query.title) {
                url = `${DOMAIN}tim-kiem-truyen.html?key=${encodeURI(query.title)}`; //encodeURI để search được chữ có dấu
            }
            else {
                if (tag[0].includes('https')) {
                    url = tag[0].split('?')[0];
                }
                else {
                    url = `${DOMAIN}${tag[0]}?`;
                }
            }
            var request = createRequestObject({
                url,
                method
            });
            if (query.title) {
                request = createRequestObject({
                    url,
                    method,
                    param: `&page=${page}`
                });
            }
            else {
                if (tag[0].includes('https')) {
                    request = createRequestObject({
                        url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        data: {
                            'idviewtop': tag[0].split('?')[1]
                        }
                    });
                }
                else {
                    request = createRequestObject({
                        url,
                        method,
                        param: `&page=${page}`
                    });
                }
            }
            var manga = [];
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            if (query.title) {
                manga = HentaiVNParser_1.parseSearch($);
            }
            else {
                if (tag[0].includes('https')) {
                    for (let obj of $('li').toArray()) {
                        const id = (_e = (_d = $('.view-top-1 > a', obj).attr('href')) === null || _d === void 0 ? void 0 : _d.split('/').pop()) !== null && _e !== void 0 ? _e : "";
                        const title = $('.view-top-1 > a', obj).text();
                        const subtitle = $(".view-top-2", obj).text().trim();
                        let request2 = createRequestObject({
                            url: DOMAIN + id,
                            method,
                        });
                        let response = yield this.requestManager.schedule(request2, 1);
                        let $2 = this.cheerio.load(response.data);
                        let image = $2('.page-ava > img').attr('src');
                        manga.push(createMangaTile({
                            id: encodeURIComponent(id) + "::" + image,
                            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                            title: createIconText({ text: title }),
                            subtitleText: createIconText({ text: subtitle }),
                        }));
                    }
                }
                else {
                    manga = HentaiVNParser_1.parseSearch($);
                }
            }
            if (query.title) {
                metadata = !HentaiVNParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            }
            else {
                if (tag[0].includes('https')) {
                    metadata = undefined;
                }
                else {
                    metadata = !HentaiVNParser_1.isLastPage($) ? { page: page + 1 } : undefined;
                }
            }
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const topView = [
                {
                    label: 'Top View Ngày',
                    id: DOMAIN + 'list-top.php?1'
                },
                {
                    label: 'Top View Tuần',
                    id: DOMAIN + 'list-top.php?2'
                },
                {
                    label: 'Top View Tháng',
                    id: DOMAIN + 'list-top.php?3'
                },
                {
                    label: 'Top View All',
                    id: DOMAIN + 'list-top.php?4'
                }
            ];
            const tagSections = [
                createTagSection({ id: '0', label: 'Bảng Xếp Hạng', tags: topView.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags_json_1.default.map(x => createTag(x)) })
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: `${DOMAIN}` + '/'
        };
    }
}
exports.HentaiVN = HentaiVN;
