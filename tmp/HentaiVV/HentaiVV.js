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
exports.HentaiVV = exports.HentaiVVInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HentaiVVParser_1 = require("./HentaiVVParser");
const DOMAIN = 'https://hentaicube.net/';
const method = 'GET';
exports.HentaiVVInfo = {
    version: '2.5.0',
    name: 'HentaiVV',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVV',
    websiteBaseURL: `https://hentaivv.com/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class HentaiVV extends paperback_extensions_common_1.Source {
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
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.gioi_thieu').text().trim();
            for (const t of $('.text-center > .btn-primary-border > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            if ($('#thong_tin tbody > tr:nth-child(1) > td:nth-child(1)').text().trim() === 'Tên Khác:') {
                creator = $('#thong_tin tbody > tr:nth-child(2) > th:nth-child(2)').text().trim();
                status = $('#thong_tin tbody > tr:nth-child(3) > th:nth-child(2) > span').text().trim().toLowerCase().includes("đang") ? 1 : 0;
            }
            else {
                creator = $('#thong_tin tbody > tr:nth-child(1) > th:nth-child(2)').text().trim();
                status = $('#thong_tin tbody > tr:nth-child(2) > th:nth-child(2) > span').text().trim().toLowerCase().includes("đang") ? 1 : 0;
            }
            const image = (_b = $('.book3d img').attr('data-src')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.row > .crop-text-1').first().text().trim()],
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
                url: `${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            const page = $('#id_pagination > li.active > a').text().trim();
            const id = $("#views").attr('data-id');
            const request2 = createRequestObject({
                url: 'https://hentaivv.com/wp-admin/admin-ajax.php',
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data: {
                    'action': 'all_chap',
                    'id': id
                }
            });
            const response2 = yield this.requestManager.schedule(request2, 1);
            const $2 = this.cheerio.load(response2.data);
            const test = $("#dsc > .listchap > li:nth-child(1) a").first().text().trim();
            if (!test) {
                if (($('#pagination .pagination-child').first().text().trim()) === '1/1') {
                    chapters.push(createChapter({
                        id: mangaId,
                        chapNum: 1,
                        name: 'Oneshot',
                        mangaId: mangaId,
                        langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    }));
                }
                else {
                    for (const obj of $2("div").toArray()) {
                        i++;
                        chapters.push(createChapter({
                            id: $('a', obj).first().attr('href'),
                            chapNum: i,
                            name: ($('a', obj).first().text().trim()),
                            mangaId: mangaId,
                            langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                        }));
                    }
                }
            }
            else {
                if (page) { //check xem có pagination không
                    for (const p of $('a', '#id_pagination').toArray()) {
                        if (isNaN(Number($(p).text().trim()))) { //a ko phải số
                            continue;
                        }
                        else {
                            const requestChap = createRequestObject({
                                url: `${mangaId + Number($(p).text().trim())}/#dsc`,
                                method,
                            });
                            const responseChap = yield this.requestManager.schedule(requestChap, 1);
                            const $Chap = this.cheerio.load(responseChap.data);
                            for (const obj of $Chap("#dsc > .listchap > li").toArray()) {
                                i++;
                                chapters.push(createChapter({
                                    id: $('a', obj).first().attr('href'),
                                    chapNum: i,
                                    name: ($('a', obj).first().text().trim()),
                                    mangaId: mangaId,
                                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                                }));
                            }
                        }
                    }
                }
                else {
                    for (const obj of $("#dsc > .listchap > li").toArray()) {
                        i++;
                        chapters.push(createChapter({
                            id: $('a', obj).first().attr('href'),
                            chapNum: i,
                            name: ($('a', obj).first().text().trim()),
                            mangaId: mangaId,
                            langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                        }));
                    }
                }
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
            for (let obj of $('.reading img').toArray()) {
                if (!obj.attribs['data-echo'])
                    continue;
                let link = obj.attribs['data-echo'].trim();
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Gợi ý hôm nay",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Hot",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện Mới Cập Nhật",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Truyện Ngẫu Nhiên",
                view_more: true,
            });
            let newest = createHomeSection({
                id: 'new',
                title: "Truyện Mới Nhất",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(view);
            sectionCallback(newest);
            ///Get the section data
            //Featured
            let url = ``;
            let request = createRequestObject({
                url: 'https://hentaivv.com/',
                method: "GET",
            });
            let featuredItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('.premiumItem > .img > a', '#duoc-quan-tam .slider-item').toArray()) {
                let title = $(`.crop-text-2`, obj).text().trim();
                const image = (_a = $('img', obj).attr('data-src')) !== null && _a !== void 0 ? _a : "";
                let id = (_b = $(obj).attr('href')) !== null && _b !== void 0 ? _b : title;
                featuredItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    })
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //Hot
            url = '';
            request = createRequestObject({
                url: 'https://hentaivv.com/truyen/',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '.theloai-thumlist').toArray()) {
                let title = $('a', obj).attr('title');
                const image = $(`a > img`, obj).attr('data-src');
                let id = (_c = $('a', obj).attr('href')) !== null && _c !== void 0 ? _c : title;
                hotItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title !== null && title !== void 0 ? title : ""
                    })
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //New Updates
            url = '';
            request = createRequestObject({
                url: 'https://hentaivv.com/tim-kiem/?title=&status=all&time=update',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '.theloai-thumlist').toArray()) {
                let title = $(`.crop-text-2 > a`, obj).text().trim();
                // let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_d = $('a > img', obj).attr('data-src')) !== null && _d !== void 0 ? _d : "";
                let id = (_e = $(`.crop-text-2 > a`, obj).attr('href')) !== null && _e !== void 0 ? _e : title;
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title !== null && title !== void 0 ? title : "",
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //ngau nhien
            url = DOMAIN;
            request = createRequestObject({
                url: 'https://hentaivv.com/tim-kiem/?title=&status=all&time=rand',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '.theloai-thumlist').toArray()) {
                let title = $(`.crop-text-2 > a`, obj).text().trim();
                // let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_f = $('a > img', obj).attr('data-src')) !== null && _f !== void 0 ? _f : "";
                let id = (_g = $(`.crop-text-2 > a`, obj).attr('href')) !== null && _g !== void 0 ? _g : title;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title,
                    }),
                }));
            }
            view.items = newAddItems;
            sectionCallback(view);
            //Newest
            url = '';
            request = createRequestObject({
                url: 'https://hentaivv.com/tim-kiem/?title=&status=all&time=new',
                method: "GET",
            });
            let newItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '.theloai-thumlist').toArray()) {
                let title = $(`.crop-text-2 > a`, obj).text().trim();
                // let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_h = $('a > img', obj).attr('data-src')) !== null && _h !== void 0 ? _h : "";
                let id = (_j = $(`.crop-text-2 > a`, obj).attr('href')) !== null && _j !== void 0 ? _j : title;
                newItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title !== null && title !== void 0 ? title : "",
                    }),
                }));
            }
            newest.items = newItems;
            sectionCallback(newest);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "new":
                    url = `https://hentaivv.com/tim-kiem/page/${page}/?title=&status=all&time=new`;
                    select = 0;
                    break;
                case "new_updated":
                    url = `https://hentaivv.com/tim-kiem/page/${page}/?title&status=all&time=update`;
                    select = 1;
                    break;
                case "view":
                    url = `https://hentaivv.com/tim-kiem/page/${page}/?title=&status=all&time=rand`;
                    select = 2;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            let manga = HentaiVVParser_1.parseViewMore($, select);
            metadata = !HentaiVVParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            var status = [];
            var time = [];
            var genre = [];
            tags.map((value) => {
                if (value.indexOf('.') === -1) {
                    genre.push(value);
                }
                else {
                    switch (value.split(".")[0]) {
                        case 'status':
                            status.push(value.split(".")[1]);
                            break;
                        case 'time':
                            time.push(value.split(".")[1]);
                            break;
                    }
                }
            });
            var genresFinal = '';
            const convertGenres = (genre) => {
                let y = [];
                for (const e of genre) {
                    let x = 'cate%5B%5D=' + e;
                    y.push(x);
                }
                genresFinal = (y !== null && y !== void 0 ? y : []).join("&");
                return genresFinal;
            };
            const request = createRequestObject({
                url: (`https://hentaivv.com/tim-kiem/page/${page}/?title=${query.title ? encodeURI(query.title) : ""}&${convertGenres(genre)}&status=${(_d = status[0]) !== null && _d !== void 0 ? _d : 'all'}&time=${(_e = time[0]) !== null && _e !== void 0 ? _e : 'update'}`),
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = HentaiVVParser_1.parseSearch($);
            metadata = !HentaiVVParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const tags2 = [];
            const tags3 = [];
            const url = `https://hentaivv.com/tim-kiem/?title=`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            //the loai
            for (const tag of $('label', '#category > div:nth-child(2)').toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = $(tag).attr('for')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            //tinh trang
            for (const tag of $('#status > option', '#category > div:nth-child(3)').toArray()) {
                const label = $(tag).text().trim();
                const id = (_b = 'status.' + $(tag).attr('value')) !== null && _b !== void 0 ? _b : label;
                if (!id || !label)
                    continue;
                tags2.push({ id: id, label: label });
            }
            //thoi gian
            for (const tag of $('#status > option', '#category > div:nth-child(4)').toArray()) {
                const label = $(tag).text().trim();
                const id = (_c = 'time.' + $(tag).attr('value')) !== null && _c !== void 0 ? _c : label;
                if (!id || !label)
                    continue;
                tags3.push({ id: id, label: label });
            }
            const tagSections = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Tình Trạng Truyện', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Thời Gian', tags: tags3.map(x => createTag(x)) })];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://hentaivv.com/'
        };
    }
}
exports.HentaiVV = HentaiVV;
