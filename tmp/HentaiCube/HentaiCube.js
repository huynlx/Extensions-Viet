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
exports.HentaiCube = exports.HentaiCubeInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HentaiCubeParser_1 = require("./HentaiCubeParser");
const DOMAIN = 'https://hentaicube.net/';
const method = 'GET';
exports.HentaiCubeInfo = {
    version: '2.7.0',
    name: 'HentaiCube',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiCube',
    websiteBaseURL: `https://hentaicube.net/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class HentaiCube extends paperback_extensions_common_1.Source {
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
            let desc = $('.description-summary > .summary__content').text();
            for (const test of $('.post-content_item', '.post-content').toArray()) {
                switch ($('.summary-heading > h5', test).text().trim()) {
                    case 'Tác giả':
                        creator = $('.author-content', test).text();
                        break;
                    case 'Thể loại':
                        for (const t of $('.genres-content > a', test).toArray()) {
                            const genre = $(t).text().trim();
                            const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                            tags.push(createTag({ label: genre, id }));
                        }
                        break;
                    case 'Tình trạng':
                        status = $('.summary-content', test).text().trim().toLowerCase().includes("đang") ? 1 : 0;
                        break;
                    default:
                        break;
                }
            }
            const image = (_c = (_b = $('.tab-summary img').attr('data-src')) === null || _b === void 0 ? void 0 : _b.replace('-193x278', '')) !== null && _c !== void 0 ? _c : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [HentaiCubeParser_1.decodeHTMLEntity($('.post-title > h1').text().trim())],
                image: encodeURI(image),
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
            for (const obj of $(".listing-chapters_wrap li").toArray().reverse()) {
                i++;
                const getTime = $('span', obj).text().trim();
                let timeFinal = HentaiCubeParser_1.convertTime(getTime);
                chapters.push(createChapter({
                    id: $('a', obj).first().attr('href'),
                    chapNum: i,
                    name: ($('a', obj).first().text().trim()),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: timeFinal
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
            for (let obj of $('.text-left img').toArray()) {
                if (!obj.attribs['data-src'])
                    continue;
                let link = obj.attribs['data-src'].trim();
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Gợi ý hôm nay",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let top = createHomeSection({
                id: 'top',
                title: "Top view ngày",
                view_more: false,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Hot tháng",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới cập nhật",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Xem nhiều nhất",
                view_more: true,
            });
            let newest = createHomeSection({
                id: 'new',
                title: "Mới thêm",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(top);
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(view);
            sectionCallback(newest);
            ///Get the section data
            //Featured
            let url = ``;
            let request = createRequestObject({
                url: 'https://hentaicube.net/',
                method: "GET",
            });
            let featuredItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('.item__wrap ', '.slider__container .slider__item').toArray()) {
                let title = $(`.slider__content .post-title`, obj).text().trim();
                let subtitle = $(`.slider__content .chapter-item a`, obj).first().text().trim();
                const image = (_b = (_a = $('.slider__thumb a > img', obj).attr('data-src')) === null || _a === void 0 ? void 0 : _a.replace('-110x150', '')) !== null && _b !== void 0 ? _b : "";
                let id = (_c = $(`.slider__thumb a`, obj).attr('href')) !== null && _c !== void 0 ? _c : title;
                featuredItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({
                        text: HentaiCubeParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
                    }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //top
            url = '';
            request = createRequestObject({
                url: 'https://hentaicube.net/',
                method: "GET",
            });
            let topItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.popular-item-wrap', '#manga-recent-2 .widget-content').toArray()) {
                let title = $(`.popular-content a`, obj).text().trim();
                const image = (_d = $(`.popular-img > a > img`, obj).attr('data-src')) === null || _d === void 0 ? void 0 : _d.replace('-75x106', '');
                let id = (_e = $(`.popular-img > a`, obj).attr('href')) !== null && _e !== void 0 ? _e : title;
                topItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({
                        text: HentaiCubeParser_1.decodeHTMLEntity(title),
                    })
                }));
            }
            top.items = topItems;
            sectionCallback(top);
            //Hot
            url = '';
            request = createRequestObject({
                url: 'https://hentaicube.net/',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.popular-item-wrap', '#manga-recent-3 .widget-content').toArray()) {
                let title = $(`.popular-content a`, obj).text().trim();
                const image = (_f = $(`.popular-img > a > img`, obj).attr('data-src')) === null || _f === void 0 ? void 0 : _f.replace('-75x106', '');
                let id = (_g = $(`.popular-img > a`, obj).attr('href')) !== null && _g !== void 0 ? _g : title;
                hotItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({
                        text: HentaiCubeParser_1.decodeHTMLEntity(title),
                    })
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //New Updates
            url = '';
            request = createRequestObject({
                url: 'https://hentaicube.net/?s&post_type=wp-manga&m_orderby=latest',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
                let title = $(`.post-title > h3 > a`, obj).text().trim();
                let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_h = $('.c-image-hover > a > img', obj).attr('data-src')) !== null && _h !== void 0 ? _h : "";
                let id = (_j = $(`.c-image-hover > a`, obj).attr('href')) !== null && _j !== void 0 ? _j : title;
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(image),
                    title: createIconText({
                        text: (_k = HentaiCubeParser_1.decodeHTMLEntity(title)) !== null && _k !== void 0 ? _k : "",
                    }),
                    subtitleText: createIconText({
                        text: subtitle
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //view
            url = DOMAIN;
            request = createRequestObject({
                url: 'https://hentaicube.net/?s&post_type=wp-manga&m_orderby=views',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
                let title = $(`.post-title > h3 > a`, obj).text().trim();
                let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_l = $('.c-image-hover > a > img', obj).attr('data-src')) !== null && _l !== void 0 ? _l : "";
                let id = (_m = $(`.c-image-hover > a`, obj).attr('href')) !== null && _m !== void 0 ? _m : title;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
                    }),
                }));
            }
            view.items = newAddItems;
            sectionCallback(view);
            //Newest
            url = '';
            request = createRequestObject({
                url: 'https://hentaicube.net/?s&post_type=wp-manga&m_orderby=new-manga',
                method: "GET",
            });
            let newItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
                let title = $(`.post-title > h3 > a`, obj).text().trim();
                let subtitle = $(`.chapter > a`, obj).text().trim();
                const image = (_o = $('.c-image-hover > a > img', obj).attr('data-src')) !== null && _o !== void 0 ? _o : "";
                let id = (_p = $(`.c-image-hover > a`, obj).attr('href')) !== null && _p !== void 0 ? _p : title;
                newItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(image),
                    title: createIconText({
                        text: title !== null && title !== void 0 ? title : "",
                    }),
                    subtitleText: createIconText({
                        text: subtitle
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
                    url = `https://hentaicube.net/page/${page}/?s&post_type=wp-manga&m_orderby=new-manga`;
                    select = 0;
                    break;
                case "new_updated":
                    url = `https://hentaicube.net/page/${page}/?s&post_type=wp-manga&m_orderby=latest`;
                    select = 1;
                    break;
                case "view":
                    url = `https://hentaicube.net/page/${page}/?s&post_type=wp-manga&m_orderby=views`;
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
            let manga = HentaiCubeParser_1.parseViewMore($, select);
            metadata = !HentaiCubeParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            var status = [];
            var year = [];
            var sort = [];
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
                        case 'year':
                            year.push(value.split("year.")[1]);
                            break;
                        case 'sort':
                            sort.push(value.split("&")[2]);
                            break;
                    }
                }
            });
            var statusFinal = '';
            var genresFinal = '';
            const convertStatus = (status) => {
                let y = [];
                for (const e of status) {
                    let x = 'status=' + e;
                    y.push(x);
                }
                statusFinal = (y !== null && y !== void 0 ? y : []).join("&");
                return statusFinal;
            };
            const convertGenres = (genre) => {
                let y = [];
                for (const e of genre) {
                    let x = 'genre=' + e;
                    y.push(x);
                }
                genresFinal = (y !== null && y !== void 0 ? y : []).join("&");
                return genresFinal;
            };
            var url = '';
            var set = 1;
            //search chưa ngon lắm :))
            if (year.length !== 0) { //year + sort
                if (tags[0].split('.')[0] === 'year' || tags[0].split('.')[0] === 'sort') {
                    if (year.length !== 0 && sort.length !== 0) {
                        set = 0;
                        url = encodeURI(`${year[0]}page/${page}/?${sort[0]}`);
                    }
                    else {
                        if (tags[0].split('.')[0] === 'year') {
                            set = 0;
                            url = encodeURI(`${year[0]}page/${page}/`);
                        }
                        else {
                            set = 1;
                            url = encodeURI(`https://hentaicube.net/page/${page}/?s&post_type=wp-manga&${sort[0]}`);
                        }
                    }
                }
            }
            else { //keyword + genre + status + sort
                set = 1;
                url = encodeURI(`https://hentaicube.net/page/${page}/?s=${(_d = query.title) !== null && _d !== void 0 ? _d : ""}&post_type=wp-manga&${convertGenres(genre)}&op=&author=&artist=&release=&adult=&${convertStatus(status)}&${sort[0]}`);
            }
            const request = createRequestObject({
                url,
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = HentaiCubeParser_1.parseSearch($, set);
            metadata = !HentaiCubeParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const tags2 = [];
            const tags3 = [];
            const tags4 = [];
            const counts = [];
            let url = `https://hentaicube.net/?s=&post_type=wp-manga`;
            let request = createRequestObject({
                url: url,
                method: "GET",
            });
            let response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            let url2 = `https://hentaicube.net/manga/`;
            let request2 = createRequestObject({
                url: url2,
                method: "GET",
            });
            let response2 = yield this.requestManager.schedule(request2, 1);
            let $2 = this.cheerio.load(response2.data);
            for (const cc of $2('a', '.list-unstyled').toArray()) {
                const count = $2('.count', cc).text();
                counts.push(count);
            }
            //the loai
            var i = 0;
            for (const tag of $('.checkbox', '.checkbox-group').toArray()) {
                const label = $('label', tag).text().trim() + counts[i];
                const id = (_a = $('input', tag).attr('id')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
                i++;
            }
            //tinh trang
            for (const tag of $('.checkbox-inline', '.search-advanced-form > .form-group:nth-child(9) ').toArray()) {
                const label = $('label', tag).text().trim();
                const id = (_b = 'status.' + $('input', tag).attr('value')) !== null && _b !== void 0 ? _b : label;
                if (!id || !label)
                    continue;
                tags2.push({ id: id, label: label });
            }
            //sap xep
            for (const tag of $('li', '.c-tabs-content').toArray()) {
                const label = $('a', tag).text().trim();
                const id = (_c = 'sort.' + $('a', tag).attr('href')) !== null && _c !== void 0 ? _c : label;
                if (!id || !label)
                    continue;
                tags4.push({ id: id, label: label });
            }
            url = `https://hentaicube.net/manga/`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            response = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(response.data);
            //nam
            for (const tag of $('li', '#wp_manga_release_id-2 .c-released_content .list-released').toArray()) {
                for (const tag2 of $('a', tag).toArray()) {
                    const label = $(tag2).text().trim();
                    const id = (_d = 'year.' + $(tag2).attr('href')) !== null && _d !== void 0 ? _d : label;
                    if (!id || !label)
                        continue;
                    tags3.push({ id: id, label: label });
                }
            }
            const tagSections = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Tình Trạng', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Năm', tags: tags3.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Xếp theo', tags: tags4.map(x => createTag(x)) })
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://hentaicube.net/'
        };
    }
}
exports.HentaiCube = HentaiCube;
