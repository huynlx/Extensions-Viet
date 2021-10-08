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
exports.TruyentranhLH = exports.TruyentranhLHInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyentranhLHParser_1 = require("./TruyentranhLHParser");
const DOMAIN = 'https://truyentranhlh.net/';
const method = 'GET';
exports.TruyentranhLHInfo = {
    version: '2.0.0',
    name: 'TruyentranhLH',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyentranhLH',
    websiteBaseURL: `https://truyentranhlh.net/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class TruyentranhLH extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${DOMAIN}truyen-tranh/${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}truyen-tranh/${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.summary-content > p').text();
            for (const test of $('.info-item', '.series-information').toArray()) {
                switch ($('.info-name', test).text().trim()) {
                    case 'Tác giả:':
                        creator = $('.info-value', test).text();
                        break;
                    case 'Thể loại:':
                        for (const t of $('.info-value > a', test).toArray()) {
                            const genre = $('span', t).text().trim();
                            const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                            tags.push(createTag({ label: genre, id }));
                        }
                        break;
                    case 'Tình trạng:':
                        status = $('.info-value > a', test).text().toLowerCase().includes("đang tiến hành") ? 1 : 0;
                        break;
                    default:
                        break;
                }
            }
            const image = $('.top-part > .row > .col-12 > .series-cover > .a6-ratio > div').css('background-image');
            const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [TruyentranhLHParser_1.decodeHTMLEntity($('.series-name > a').text().trim())],
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
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
                url: `${DOMAIN}truyen-tranh/${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $(".list-chapters.at-series > a").toArray().reverse()) {
                var chapNum = parseFloat($('li > .chapter-name', obj).text().trim().split(' ')[1]);
                i++;
                const timeStr = $('li > .chapter-time', obj).text().trim().split(/\//);
                const time = new Date([timeStr[1], timeStr[0], timeStr[2]].join('/'));
                chapters.push(createChapter({
                    id: $(obj).first().attr('href'),
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: $('li > .chapter-name', obj).text(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time
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
            for (let obj of $('#chapter-content > img').toArray()) {
                if (!obj.attribs['data-src'])
                    continue;
                let link = obj.attribs['data-src'];
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
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện hot trong ngày",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới cập nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện mới nhất",
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
                url: DOMAIN,
                method: "GET",
            });
            let hotItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('.owl-item', '.owl-stage').toArray()) {
                let title = $(`.series-title > a`, obj).text().trim();
                let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
                const image = $(`.a6-ratio > div.img-in-ratio`, obj).css('background-image');
                const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
                let id = (_b = (_a = $(`.series-title > a`, obj).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/").pop()) !== null && _b !== void 0 ? _b : title;
                // if (!id || !subtitle) continue;
                hotItems.push(createMangaTile({
                    id: id,
                    image: bg !== null && bg !== void 0 ? bg : "",
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
            for (let obj of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(1) > .card-body > .row').toArray().splice(0, 20)) {
                let title = $(`.series-title > a`, obj).text().trim();
                let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
                const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
                let id = (_d = (_c = $(`.series-title > a`, obj).attr("href")) === null || _c === void 0 ? void 0 : _c.split("/").pop()) !== null && _d !== void 0 ? _d : title;
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
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
            //New Added
            url = DOMAIN;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(2) > .card-body > .row').toArray().splice(0, 20)) {
                let title = $(`.series-title > a`, obj).text().trim();
                let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
                const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
                let id = (_f = (_e = $(`.series-title > a`, obj).attr("href")) === null || _e === void 0 ? void 0 : _e.split("/").pop()) !== null && _f !== void 0 ? _f : title;
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
                }));
            }
            newAdded.items = newAddItems;
            sectionCallback(newAdded);
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
                    url = `${DOMAIN}danh-sach?sort=update&page=${page}`;
                    break;
                case "new_added":
                    url = `${DOMAIN}danh-sach?sort=new&page=${page}`;
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
            const manga = TruyentranhLHParser_1.parseViewMore($);
            metadata = !TruyentranhLHParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const search = {
                status: "",
                sort: "update",
                genres: "",
            };
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const category = [];
            tags.map((value) => {
                if (value.indexOf('.') === -1) {
                    category.push(value);
                }
                else {
                    switch (value.split(".")[0]) {
                        case 'sort':
                            search.sort = (value.split(".")[1]);
                            break;
                        case 'status':
                            search.status = (value.split(".")[1]);
                            break;
                    }
                }
            });
            search.genres = (category !== null && category !== void 0 ? category : []).join(",");
            const request = createRequestObject({
                url: `${DOMAIN}tim-kiem`,
                method: "GET",
                param: encodeURI(`?q=${(_d = query.title) !== null && _d !== void 0 ? _d : ''}&status=${search.status}&sort=${search.sort}&accept_genres=${search.genres}&page=${page}`)
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = TruyentranhLHParser_1.parseSearch($);
            metadata = !TruyentranhLHParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}tim-kiem`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            const arrayTags2 = [];
            const arrayTags3 = [];
            //the loai
            for (const tag of $('div.search-gerne_item', 'div.form-group').toArray()) {
                const label = $('.gerne-name', tag).text().trim();
                const id = (_a = $('label', tag).attr('data-genre-id')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            //tinh trang
            for (const tag of $('option', 'select#list-status').toArray()) {
                const label = $(tag).text().trim();
                const id = (_b = 'status.' + $(tag).attr('value')) !== null && _b !== void 0 ? _b : label;
                if (!id || !label)
                    continue;
                arrayTags2.push({ id: id, label: label });
            }
            //sap xep
            for (const tag of $('option', 'select#list-sort').toArray()) {
                const label = $(tag).text().trim();
                const id = (_c = 'sort.' + $(tag).attr('value')) !== null && _c !== void 0 ? _c : label;
                if (!id || !label)
                    continue;
                arrayTags3.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Tình trạng', tags: arrayTags2.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Sắp xếp', tags: arrayTags3.map(x => createTag(x)) }),
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
exports.TruyentranhLH = TruyentranhLH;
