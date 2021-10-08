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
exports.Blogtruyen = exports.BlogtruyenInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const BlogtruyenParser_1 = require("./BlogtruyenParser");
const DOMAIN = 'https://truyentranhlh.net/';
const method = 'GET';
exports.BlogtruyenInfo = {
    version: '2.0.0',
    name: 'Blogtruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Blogtruyen',
    websiteBaseURL: `https://blogtruyen.vn`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Blogtruyen extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `https://blogtruyen.vn${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://blogtruyen.vn${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.content').text();
            for (const test of $('p', '.description').toArray()) {
                switch ($(test).clone().children().remove().end().text().trim()) {
                    case 'Tác giả:':
                        creator = BlogtruyenParser_1.decodeHTMLEntity($('a', test).text());
                        break;
                    case 'Thể loại:':
                        for (const t of $('.category > a', test).toArray()) {
                            const genre = $(t).text().trim();
                            const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                            tags.push(createTag({ label: genre, id }));
                        }
                        status = $('.color-red', $(test).next()).text().toLowerCase().includes("đang") ? 1 : 0;
                        break;
                    default:
                        break;
                }
            }
            const image = (_b = $('.thumbnail > img').attr('src')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [BlogtruyenParser_1.decodeHTMLEntity($('.entry-title > a').text().trim())],
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
                url: `https://blogtruyen.vn${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $("#list-chapters > p").toArray().reverse()) {
                i++;
                const getTime = $('.publishedDate', obj).text().trim().split(' ');
                const time = {
                    date: getTime[0],
                    time: getTime[1]
                };
                const arrDate = time.date.split(/\//);
                const fixDate = [arrDate[1], arrDate[0], arrDate[2]].join('/');
                const finalTime = new Date(fixDate + ' ' + time.time);
                chapters.push(createChapter({
                    id: $('span.title > a', obj).first().attr('href'),
                    chapNum: i,
                    name: BlogtruyenParser_1.decodeHTMLEntity($('span.title > a', obj).text().trim()),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: finalTime
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `https://blogtruyen.vn${chapterId}`,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('#content > img').toArray()) {
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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện xem nhiều nhất",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới cập nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện mới đăng",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            //Featured
            let url = `${DOMAIN}`;
            let request = createRequestObject({
                url: 'https://blogtruyen.vn/thumb',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let featuredItems = [];
            for (let manga of $('a', 'div#storyPinked').toArray()) {
                const title = ($('p:first-child', $(manga).next()).text().trim());
                const id = $(manga).attr('href');
                const image = (_b = (_a = $('img', manga).attr('src')) === null || _a === void 0 ? void 0 : _a.replace('182_182', '400')) !== null && _b !== void 0 ? _b : "";
                const subtitle = ($('p:last-child', $(manga).next()).text().trim());
                if (!id || !title)
                    continue;
                featuredItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
                    title: createIconText({ text: BlogtruyenParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: BlogtruyenParser_1.decodeHTMLEntity(subtitle) }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //Hot
            url = '';
            request = createRequestObject({
                url: 'https://blogtruyen.vn/ajax/Search/AjaxLoadListManga?key=tatca&orderBy=3&p=1',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('p:not(:first-child)', '.list').toArray()) {
                let title = $(`a`, obj).text().trim();
                let subtitle = 'Chương ' + $(`span:nth-child(2)`, obj).text().trim();
                const image = (_c = $('img', $(obj).next()).attr('src')) !== null && _c !== void 0 ? _c : "";
                let id = (_d = $(`a`, obj).attr('href')) !== null && _d !== void 0 ? _d : title;
                hotItems.push(createMangaTile({
                    id: id,
                    image: encodeURI(image.replace('150', '200')),
                    title: createIconText({
                        text: BlogtruyenParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
                    }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //New Updates
            url = '';
            request = createRequestObject({
                url: 'https://blogtruyen.vn/thumb',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('.row', '.list-mainpage .storyitem').toArray().splice(0, 20)) {
                let title = $(`h3.title > a`, obj).attr('title');
                let subtitle = $(`div:nth-child(2) > div:nth-child(4) > span:nth-child(1) > .color-red`, obj).text();
                const image = $(`div:nth-child(1) > a > img`, obj).attr('src');
                let id = (_e = $(`div:nth-child(1) > a`, obj).attr('href')) !== null && _e !== void 0 ? _e : title;
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                    title: createIconText({
                        text: BlogtruyenParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: 'Chương ' + subtitle,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //New Added
            url = DOMAIN;
            request = createRequestObject({
                url: 'https://blogtruyen.vn/thumb',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('a', '#top-newest-story').toArray()) {
                let title = (_g = (_f = $(obj).attr('title')) === null || _f === void 0 ? void 0 : _f.trim()) !== null && _g !== void 0 ? _g : "";
                // let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
                const image = $(`img`, obj).attr('src');
                let id = (_h = $(obj).attr("href")) !== null && _h !== void 0 ? _h : title;
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('86_86', '200')),
                    title: createIconText({
                        text: BlogtruyenParser_1.decodeHTMLEntity(title),
                    })
                    // subtitleText: createIconText({
                    //     text: subtitle,
                    // }),
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
            let select = 1;
            switch (homepageSectionId) {
                case "hot":
                    url = `https://blogtruyen.vn/ajax/Search/AjaxLoadListManga?key=tatca&orderBy=3&p=${page}`;
                    select = 0;
                    break;
                case "new_updated":
                    url = `https://blogtruyen.vn/thumb-${page}`;
                    select = 1;
                    break;
                // case "new_added":
                //     url = `https://sayhentai.net/danh-sach-truyen.html?status=0&sort=id&page=${page}`;
                //     select = 1;
                //     break;
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
            const manga = BlogtruyenParser_1.parseViewMore($, select);
            metadata = !BlogtruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const request = createRequestObject({
                url: encodeURI(`https://blogtruyen.vn/timkiem/nangcao/1/0/${tags[0] ? tags[0] : '-1'}/-1?txt=${query.title ? query.title : ''}`),
                method: "GET",
                param: encodeURI(`&p=${page}`)
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = BlogtruyenParser_1.parseSearch($);
            metadata = !BlogtruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const url = `https://blogtruyen.vn/timkiem/nangcao`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            //the loai
            for (const tag of $('li', '.list-unstyled.row').toArray()) {
                const label = BlogtruyenParser_1.decodeHTMLEntity($(tag).text().trim());
                const id = (_a = $(tag).attr('data-id')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            const tagSections = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://blogtruyen.vn/'
        };
    }
}
exports.Blogtruyen = Blogtruyen;
