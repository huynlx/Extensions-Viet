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
exports.qManga = exports.qMangaInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const qMangaParser_1 = require("./qMangaParser");
const method = 'GET';
exports.qMangaInfo = {
    version: '2.0.0',
    name: 'qManga',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from qManga',
    websiteBaseURL: `https://qmanga.co/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class qManga extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 0.5,
            requestTimeout: 15000
        });
    }
    getMangaShareUrl(mangaId) { return `${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = $('.writer a').text().trim();
            let status = $('.status_commic > p').text().trim(); //completed, 1 = Ongoing
            let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $(".desc-commic-detail").text().trim();
            for (const t of $('.categories-list-detail-commic > li > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_b = $('.image-commic-detail img').attr('data-src')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.title-commic-detail').text().trim()],
                image: qMangaParser_1.decodeHTMLEntity(encodeURI(image)),
                status: statusFinal,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${mangaId}`,
                method,
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            var i = 0;
            for (const obj of $('.ul-list-chaper-detail-commic > li').toArray()) {
                i++;
                let id = $('a', obj).first().attr('href');
                let chapNum = parseFloat((_a = $('a', obj).first().text().trim()) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                let name = $('a', obj).first().text().trim();
                let time = $('span', obj).first().text().trim().split('-');
                chapters.push(createChapter({
                    id,
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(time[1] + '/' + time[0] + '/' + time[2])
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
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const pages = [];
            for (let obj of $('#aniimated-thumbnial > img').toArray()) {
                let link = (_a = $(obj).attr('src')) !== null && _a !== void 0 ? _a : "";
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
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới nhất",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Nổi bật",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Phổ biến",
                view_more: true,
            });
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://qmanga.co/de-nghi/pho-bien/moi-nhat',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('li', '.detail-bxh-ul').toArray().splice(0, 15)) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_a = $('.image-commic-bxh img', element).attr('data-src')) !== null && _a !== void 0 ? _a : "";
                let id = $('.image-commic-bxh > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: qMangaParser_1.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            //hot
            request = createRequestObject({
                url: 'https://qmanga.co/danh-muc/noi-bat',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('li', '.content-tab').toArray().splice(0, 15)) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_b = $('.image-commic-tab img', element).attr('data-src')) !== null && _b !== void 0 ? _b : "";
                let id = $('.image-commic-tab > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                hotItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: qMangaParser_1.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            hot.items = hotItems;
            //view
            request = createRequestObject({
                url: 'https://qmanga.co/danh-muc/pho-bien',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('li', '.content-tab').toArray().splice(0, 15)) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_c = $('.image-commic-tab img', element).attr('data-src')) !== null && _c !== void 0 ? _c : "";
                let id = $('.image-commic-tab > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                viewItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: qMangaParser_1.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            view.items = viewItems;
            //featured
            request = createRequestObject({
                url: 'https://qmanga.co/',
                method: "GET",
            });
            let featuredItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('a', '.top-new').toArray()) {
                let title = $('img', element).attr('title');
                let image = (_d = $('img', element).attr('data-src')) !== null && _d !== void 0 ? _d : $('img', element).attr('src');
                let id = $(element).attr('href');
                // let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                featuredItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: qMangaParser_1.decodeHTMLEntity(encodeURI(image !== null && image !== void 0 ? image : "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title !== null && title !== void 0 ? title : "" }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            sectionCallback(newUpdated);
            sectionCallback(hot);
            sectionCallback(view);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://qmanga.co/de-nghi/pho-bien/moi-nhat?page=${page}`;
                    select = 1;
                    break;
                case "hot":
                    url = `https://qmanga.co/danh-muc/noi-bat?page=${page}`;
                    select = 2;
                    break;
                case "view":
                    url = `https://qmanga.co/danh-muc/pho-bien?page=${page}`;
                    select = 3;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let manga = qMangaParser_1.parseViewMore($, select);
            metadata = !qMangaParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                cate: '',
                translator: "",
                writer: "",
                status: "",
                sort: "moi-nhat"
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'translator':
                        search.translator = (value.split(".")[1]);
                        break;
                    case 'writer':
                        search.writer = (value.split(".")[1]);
                        break;
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break;
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break;
                }
            });
            const request = createRequestObject({
                url: query.title ? encodeURI(`https://qmanga.co/tim-kiem?q=${query.title}&page=${page}`) :
                    (tags[0].includes('http') ? (tags[0] + `?page=${page}`) :
                        encodeURI(`https://qmanga.co/danh-muc/${search.cate}?page=${page}`)),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = qMangaParser_1.parseSearch($, query, tags);
            metadata = !qMangaParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const tags2 = [
                {
                    id: 'https://qmanga.co/bang-xep-hang/top-ngay',
                    label: 'Top ngày'
                },
                {
                    id: 'https://qmanga.co/bang-xep-hang/top-tuan',
                    label: 'Top tuần'
                },
                {
                    id: 'https://qmanga.co/bang-xep-hang/top-thang',
                    label: 'Top tháng'
                }
            ];
            const tags5 = [
                {
                    id: 'status.',
                    label: 'Tất cả'
                },
                {
                    id: 'status.1',
                    label: 'Đã hoàn thành'
                },
                {
                    id: 'status.2',
                    label: 'Chưa hoàn thành'
                }
            ];
            const tags6 = [
                {
                    id: 'sort.moi-nhat',
                    label: 'Mới nhất'
                },
                {
                    id: 'sort.dang-hot',
                    label: 'Đang hot'
                },
                {
                    id: 'sort.cu-nhat',
                    label: 'Cũ nhất'
                }
            ];
            const url = `https://qmanga.co/`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.menu-cate-mobile a').toArray()) {
                const label = $(tag).text().trim();
                const id = 'cate.' + ((_b = (_a = $(tag).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop()) === null || _b === void 0 ? void 0 : _b.trim());
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            const tagSections = [createTagSection({ id: '0', label: 'Bảng xếp hạng', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://qmanga.co/'
        };
    }
}
exports.qManga = qManga;
