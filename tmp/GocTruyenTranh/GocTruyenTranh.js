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
exports.GocTruyenTranh = exports.GocTruyenTranhInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const GocTruyenTranhParser_1 = require("./GocTruyenTranhParser");
const DOMAIN = 'https://goctruyentranh.com/';
const method = 'GET';
exports.GocTruyenTranhInfo = {
    version: '1.0.0',
    name: 'GocTruyenTranh',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from GocTruyenTranh',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class GocTruyenTranh extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${mangaId.split("::")[0]}`; }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${mangaId.split("::")[0]}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //0 = completed, 1 = Ongoing
            let desc = $('.detail-section .description .content').text();
            creator = $('.detail-section .author')
                .clone() //clone the element
                .children() //select all the children
                .remove() //remove all the children
                .end() //again go back to selected element
                .text();
            for (const t of $('.detail-section .category a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            status = $('.detail-section .status')
                .clone() //clone the element
                .children() //select all the children
                .remove() //remove all the children
                .end() //again go back to selected element
                .text().includes('Đang') ? 1 : 0;
            const image = $('.detail-section .photo > img').attr('src');
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: GocTruyenTranhParser_1.decodeHTMLEntity(desc),
                titles: [GocTruyenTranhParser_1.decodeHTMLEntity($('.detail-section .title > h1').text().trim())],
                image: encodeURI(image),
                status,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `https://goctruyentranh.com/api/comic/${mangaId.split("::")[1]}/chapter?offset=0&limit=-1`,
                method,
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const chapters = [];
            for (const obj of json.result.chapters) {
                var chapNum = parseFloat(obj.numberChapter);
                const timeStr = obj.stringUpdateTime;
                chapters.push(createChapter({
                    id: mangaId.split('::')[0] + '/chuong-' + obj.numberChapter,
                    chapNum: chapNum,
                    name: obj.name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: GocTruyenTranhParser_1.convertTime(timeStr)
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${chapterId}`,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('.view-section > .viewer > img').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                let link = obj.attribs['src'];
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
        return __awaiter(this, void 0, void 0, function* () {
            // let featured = createHomeSection({ id: 'featured', title: 'Tiêu điểm', type: HomeSectionType.featured });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Đề Xuất",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Cập Nhật Gần Đây",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện Mới",
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
                url: 'https://goctruyentranh.com/api/comic/search/view?p=0',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            hot.items = GocTruyenTranhParser_1.parseViewMore(json).splice(0, 10);
            sectionCallback(hot);
            //New Updates
            url = '';
            request = createRequestObject({
                url: 'https://goctruyentranh.com/api/comic/search/recent?p=0',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            newUpdated.items = GocTruyenTranhParser_1.parseViewMore(json).splice(0, 10);
            sectionCallback(newUpdated);
            //New Added
            url = DOMAIN;
            request = createRequestObject({
                url: 'https://goctruyentranh.com/api/comic/search/new?p=0',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            newAdded.items = GocTruyenTranhParser_1.parseViewMore(json).splice(0, 10);
            sectionCallback(newAdded);
            // //Featured
            // url = '';
            // request = createRequestObject({
            //     url: 'https://goctruyentranh.com/trang-chu',
            //     method: "GET",
            // });
            // let featuredItems: MangaTile[] = [];
            // data = await this.requestManager.schedule(request, 1);
            // $ = this.cheerio.load(data.data);
            // for (let obj of $('.background-banner ', '#slideshow').toArray()) {
            //     const image = $(`a > img`, obj).attr('src') ?? "";
            //     let id = 'https://goctruyentranh.com' + $(`a`, obj).attr("href") ?? "";
            //     featuredItems.push(createMangaTile({
            //         id: id,
            //         image: image ?? "",
            //         title: createIconText({
            //             text: '',
            //         }),
            //         subtitleText: createIconText({
            //             text: '',
            //         }),
            //     }))
            // }
            // featured.items = featuredItems;
            // sectionCallback(featured);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 0;
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "hot":
                    url = `https://goctruyentranh.com/api/comic/search/view?p=${page}`;
                    break;
                case "new_updated":
                    url = `https://goctruyentranh.com/api/comic/search/recent?p=${page}`;
                    break;
                case "new_added":
                    url = `https://goctruyentranh.com/api/comic/search/new?p=${page}`;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method,
                param
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const manga = GocTruyenTranhParser_1.parseViewMore(json);
            metadata = { page: page + 1 };
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 0;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const request = createRequestObject({
                url: query.title ? encodeURI(`https://goctruyentranh.com/api/comic/search?name=${query.title}`) : `https://goctruyentranh.com/api/comic/search/category?p=${page}&value=${tags[0]}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const tiles = GocTruyenTranhParser_1.parseSearch(json);
            metadata = query.title ? undefined : { page: page + 1 };
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://goctruyentranh.com/api/category`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const arrayTags = [];
            //the loai
            for (const tag of json.result) {
                const label = tag.name;
                const id = tag.id;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://goctruyentranh.com/'
        };
    }
}
exports.GocTruyenTranh = GocTruyenTranh;
