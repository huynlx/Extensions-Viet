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
exports.TruyenVN = exports.TruyenVNInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyenVNParser_1 = require("./TruyenVNParser");
const DOMAIN = 'https://truyenvn.tv/';
const method = 'GET';
exports.TruyenVNInfo = {
    version: '1.0.0',
    name: 'TruyenVN',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyenVN',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class TruyenVN extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return encodeURI(`${mangaId}`); }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = encodeURI(`${mangaId}`);
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.comic-description > .inner').text();
            for (const t of $('.genre > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            creator = $('.author > a').text().trim();
            status = $('.status').clone().children().remove().end().text().trim().toLowerCase().includes("hoàn thành") ? 0 : 1;
            const image = $('.book  > img').attr('src');
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [TruyenVNParser_1.decodeHTMLEntity($('h1.name').text().trim())],
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
                url: encodeURI(`${mangaId}`),
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            for (const obj of $("#chapterList a").toArray()) {
                var chapNum = parseFloat($('span:first-child', obj).text().trim().split(' ')[1]);
                var time = $('span:last-child', obj).text().trim().split('/');
                chapters.push(createChapter({
                    id: $(obj).first().attr('href'),
                    chapNum: chapNum,
                    name: $('span:first-child', obj).text().trim(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(time[1] + '/' + time[0] + '/' + time[2])
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
            for (let obj of $('.chapter-content img').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                let link = obj.attribs['src'];
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
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "On Top",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Đề Cử",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện Mới Cập Nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện Full (Đã hoàn thành)",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(featured);
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
            for (let obj of $('.entry', '.container > section:nth-child(2) .form-row').toArray()) {
                let title = $(`h3.name > a`, obj).text().trim();
                let subtitle = $(`span.link`, obj).text().trim();
                const image = $(`a > img`, obj).attr('data-src');
                let id = (_a = $(`a`, obj).attr("href")) !== null && _a !== void 0 ? _a : title;
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
            //Featured
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let topItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('a', '.container > section#home').toArray()) {
                let title = $(`h2.name > span`, obj).text().trim();
                let subtitle = $(`.badge > h3`, obj).text().trim();
                const image = $(obj).css('background-image');
                const bg = image === null || image === void 0 ? void 0 : image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
                let id = (_b = $(obj).attr("href")) !== null && _b !== void 0 ? _b : title;
                topItems.push(createMangaTile({
                    id: id,
                    image: bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
                }));
            }
            featured.items = topItems;
            sectionCallback(featured);
            //New Updates
            url = '';
            request = createRequestObject({
                url: 'https://truyenvn.tv/danh-sach-truyen',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.entry ', '.form-row').toArray().splice(0, 15)) {
                let title = $(`a`, obj).attr('title');
                let subtitle = $(`span.link`, obj).text().trim();
                const image = $(`a > img`, obj).attr('data-src');
                let id = (_c = $(`a`, obj).attr("href")) !== null && _c !== void 0 ? _c : title;
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
            //New Added
            url = DOMAIN;
            request = createRequestObject({
                url: 'https://truyenvn.tv/truyen-hoan-thanh',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.entry ', '.form-row').toArray().splice(0, 15)) {
                let title = $(`a`, obj).attr('title');
                let subtitle = $(`span.link`, obj).text().trim();
                const image = $(`a > img`, obj).attr('data-src');
                let id = (_d = $(`a`, obj).attr("href")) !== null && _d !== void 0 ? _d : title;
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
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
                    url = `https://truyenvn.tv/danh-sach-truyen/page/${page}`;
                    break;
                case "new_added":
                    url = `https://truyenvn.tv/truyen-hoan-thanh/page/${page}`;
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
            const manga = TruyenVNParser_1.parseViewMore($);
            metadata = !TruyenVNParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const search = {
                name: (_d = query.title) !== null && _d !== void 0 ? _d : '',
                genres: ''
            };
            search.genres = tags[0];
            var url = '';
            if (search.name) {
                url = `https://truyenvn.tv/danh-sach-truyen/page/${page}?q=${search.name}`;
            }
            else {
                url = search.genres + `/page/${page}`;
            }
            const request = createRequestObject({
                url,
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = TruyenVNParser_1.parseSearch($);
            metadata = !TruyenVNParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const request = createRequestObject({
                url: 'https://truyenvn.tv/the-loai-truyen',
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (const tag of $('.theloai a').toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = $(tag).attr('href')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            const tags1 = [
                {
                    "id": "https://truyenvn.tv/truyen-hot",
                    "label": "Top All"
                },
                {
                    "id": "https://truyenvn.tv/top-ngay",
                    "label": "Top Ngày"
                },
                {
                    "id": "https://truyenvn.tv/top-tuan",
                    "label": "Top Tuần"
                },
                {
                    "id": "https://truyenvn.tv/top-thang",
                    "label": "Top Tháng"
                },
                {
                    "id": "https://truyenvn.tv/top-nam",
                    "label": "Top Năm"
                }
            ];
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Bảng Xếp Hạng', tags: tags1.map(x => createTag(x)) })
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
exports.TruyenVN = TruyenVN;
