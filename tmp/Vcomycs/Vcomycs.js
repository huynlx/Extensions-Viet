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
exports.Vcomycs = exports.VcomycsInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const VcomycsParser_1 = require("./VcomycsParser");
const method = 'GET';
exports.VcomycsInfo = {
    version: '1.0.0',
    name: 'Vcomycs',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Vcomycs',
    websiteBaseURL: `https://vcomycs.com/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Vcomycs extends paperback_extensions_common_1.Source {
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
            let creator = $(".comic-intro-text span").toArray();
            let status = $(".comic-intro-text .comic-stt").text(); //completed, 1 = Ongoing
            let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $(".text-justify p").text();
            for (const t of $(".comic-info .tags > a").toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_b = $(".img-thumbnail").attr("src")) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: $(creator[1]).text().trim(),
                artist: $(creator[1]).text().trim(),
                desc: desc === '' ? 'Đang cập nhật…' : VcomycsParser_1.decodeHTMLEntity(desc),
                titles: [$(".info-title").text()],
                image: image,
                status: statusFinal,
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
            var el = $("tbody td a").toArray();
            for (var i in el) {
                var e = el[i];
                let id = $(e).attr("href");
                let chapNum = Number((_a = $(e).text().trim().match(/Chap.+/)) === null || _a === void 0 ? void 0 : _a[0].split(" ")[1]);
                let name = $($('span', e).toArray()[0]).text().trim();
                // let time = $('tr > td.hidden-xs.hidden-sm', e).text().trim().split('/');
                chapters.push(createChapter({
                    id,
                    chapNum: chapNum,
                    name: VcomycsParser_1.decodeHTMLEntity(name),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
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
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapterDetails = createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: VcomycsParser_1.decryptImages($, this),
                longStrip: false
            });
            return chapterDetails;
        });
    }
    getHomePageSections(sectionCallback) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới cập nhật",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Hot nhất",
                view_more: false,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Xem nhiều",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(hot);
            sectionCallback(view);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://vcomycs.com/',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('.comic-item', '.col-md-9 > .comic-list ').toArray().splice(0, 20)) {
                let title = $('.comic-title', element).text().trim();
                let image = (_a = $('.img-thumbnail', element).attr('data-thumb')) !== null && _a !== void 0 ? _a : "";
                let id = $('.comic-img > a', element).first().attr('href');
                let subtitle = $(`.comic-chapter`, element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: (_b = image.replace('150x150', '300x404')) !== null && _b !== void 0 ? _b : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //hot
            request = createRequestObject({
                url: 'https://vcomycs.com/truyen-hot-nhat/',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('li', '.col-md-9 .comic-list-page ul.most-views').toArray()) {
                let title = $('.super-title > a', element).text().trim();
                let image = (_c = $('.list-left-img', element).attr('src')) !== null && _c !== void 0 ? _c : "";
                let id = $('.super-title > a', element).first().attr('href');
                hotItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: (_d = image.replace('150x150', '300x404')) !== null && _d !== void 0 ? _d : "",
                    title: createIconText({ text: title }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //view
            request = createRequestObject({
                url: 'https://vcomycs.com/nhieu-xem-nhat/',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('li', '.col-md-9 .comic-list-page ul.most-views').toArray()) {
                let title = $('.super-title > a', element).text().trim();
                let image = (_e = $('.list-left-img', element).attr('src')) !== null && _e !== void 0 ? _e : "";
                let id = $('.super-title > a', element).first().attr('href');
                // let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                viewItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: (_f = image.replace('150x150', '300x404')) !== null && _f !== void 0 ? _f : "",
                    title: createIconText({ text: title }),
                }));
            }
            view.items = viewItems;
            sectionCallback(view);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://vcomycs.com/page/${page}/`;
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
            let manga = VcomycsParser_1.parseViewMore($);
            metadata = { page: page + 1 };
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // let page = metadata?.page ?? 1;
            const tags = (_b = (_a = query.includedTags) === null || _a === void 0 ? void 0 : _a.map(tag => tag.id)) !== null && _b !== void 0 ? _b : [];
            var url = '';
            var request = '';
            if (query.title) {
                url = 'https://vcomycs.com/wp-admin/admin-ajax.php';
                request = createRequestObject({
                    url,
                    method: 'post',
                    data: {
                        "action": "searchtax",
                        "keyword": query.title
                    },
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                });
            }
            else {
                url = tags[0];
                request = createRequestObject({
                    url,
                    method: "GET",
                });
            }
            let data = yield this.requestManager.schedule(request, 1);
            var tiles = [];
            if (query.title) {
                const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
                let listItems = [];
                for (const el of json.data) {
                    listItems.push(createMangaTile({
                        id: el.link,
                        image: el.img.replace('150x150', '300x404'),
                        title: createIconText({ text: el.title }),
                    }));
                }
                tiles = listItems;
            }
            else {
                let $ = this.cheerio.load(data.data);
                tiles = VcomycsParser_1.parseSearch($);
            }
            metadata = undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const url = `https://vcomycs.com/so-do-trang/`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var genres = $('a', $(".tags").toArray()[0]).toArray();
            //the loai
            for (var i in genres) {
                var genre = genres[i];
                const label = $(genre).text().trim();
                const id = $(genre).attr('href');
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://vcomycs.com/'
        };
    }
}
exports.Vcomycs = Vcomycs;
