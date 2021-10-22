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
exports.WComic = exports.WComicInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const WComicParser_1 = require("./WComicParser");
const DOMAIN = 'https://wcomic.site/';
const method = 'GET';
exports.WComicInfo = {
    version: '1.0.0',
    name: 'WComic',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from WComic',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class WComic extends paperback_extensions_common_1.Source {
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
            let desc = $('.desc').text().replace('Nội dung', '').trim();
            for (const t of $('.list_cate a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            creator = '';
            status = $('.status > div').last().text().toLowerCase().includes("đang") ? 1 : 0;
            const image = $('.first > img').attr('src');
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.heading_comic').text().trim()],
                image: image,
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
                url: `${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $(".list_item_chap > a").toArray().reverse()) {
                var chapNum = parseFloat($('span', obj).first().text().trim());
                i++;
                chapters.push(createChapter({
                    id: $(obj).attr('href'),
                    chapNum: chapNum,
                    name: '',
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: WComicParser_1.convertTime($('span', obj).last().text().trim())
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
            for (let obj of $('.list_img_chap > img').toArray()) {
                if (!obj.attribs['data-src'])
                    continue;
                let link = obj.attribs['data-src'].includes('http') ?
                    (obj.attribs['data-src']).trim() : (DOMAIN + obj.attribs['data-src']).trim();
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới cập nhập",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            ///Get the section data
            //Hot
            let url = '';
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let hotItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('.owl-carousel > div').toArray()) {
                let title = $(`.name`, obj).text().trim();
                let subtitle = $(`.chap_newest`, obj).text().trim() + ' | ' + $('.time_update', obj).text().trim();
                const image = $(`img`, obj).attr('src');
                let id = (_a = $(`a`, obj).first().attr("href")) !== null && _a !== void 0 ? _a : title;
                // if (!id || !subtitle) continue;
                hotItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //New Updates
            url = '';
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.wc_comic_list > .wc_item').toArray()) {
                let title = $(`a`, obj).first().attr('title');
                let subtitle = $(`.row_one > span:first-child`, obj).text().trim();
                const image = $(`a:first-child img`, obj).attr('src');
                let id = $(`a:first-child`, obj).attr('href');
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
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
                    url = `${DOMAIN}truyen-moi-cap-nhap/trang-${page}.html`;
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
            const manga = WComicParser_1.parseViewMore($);
            metadata = !WComicParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const search = {
                cate: "",
                status: "",
                rating: "",
                min: ""
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break;
                    case 'rating':
                        search.rating = (value.split(".")[1]);
                        break;
                    case 'min':
                        search.min = (value.split(".")[1]);
                        break;
                }
            });
            const request = createRequestObject({
                url: (query.title ? encodeURI(`${DOMAIN}tim-kiem/${query.title}/trang-${page}.html`) : encodeURI(`${DOMAIN}loc-truyen/cate-${search.cate}/status-${search.status}/rating-${search.rating}/minchap-${search.min}/trang-${page}.html`)),
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = WComicParser_1.parseSearch($);
            metadata = !WComicParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `${DOMAIN}loc-truyen`;
            const request = createRequestObject({
                url,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const tags = [];
            const tags1 = [];
            const tags2 = [];
            const tags3 = [];
            //the loai
            for (const tag of $('.checkbox_form > div').toArray()) {
                const label = $('label', tag).text().trim();
                const id = 'cate.' + $('input', tag).attr('value');
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            //tinh trang
            for (const tag of $('select[name="status_filter"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'status.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags1.push({ id: id, label: label });
            }
            //diem
            for (const tag of $('select[name="rating_filter"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'rating.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags2.push({ id: id, label: label });
            }
            //chap
            for (const tag of $('select[name="minchap_filter"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'min.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags3.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Tình Trạng', tags: tags1.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Điểm', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Tổng Chap', tags: tags3.map(x => createTag(x)) })
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
exports.WComic = WComic;
