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
exports.LXHentai = exports.LXHentaiInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
// import axios from "axios";
const LXHentaiParser_1 = require("./LXHentaiParser");
const DOMAIN = 'https://lxhentai.com/';
const method = 'GET';
exports.LXHentaiInfo = {
    version: '2.0.0',
    name: 'LXHentai',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from LXHentai',
    websiteBaseURL: `https://lxhentai.com/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class LXHentai extends paperback_extensions_common_1.Source {
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
            const request = createRequestObject({
                url: `${mangaId}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 10);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let artist = '';
            let desc = $('.detail-content > p').text();
            for (const a of $('.row.mt-2 > .col-4.py-1').toArray()) {
                switch ($(a).text().trim()) {
                    case "Tác giả":
                        creator = $(a).next().text();
                        break;
                    case "Tình trạng":
                        status = $(a).next().text().toLowerCase().includes("đã") ? 0 : 1;
                        break;
                    case "Thể loại":
                        for (const t of $('a', $(a).next()).toArray()) {
                            const genre = $(t).text().trim();
                            const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                            tags.push(createTag({ label: genre, id }));
                        }
                        break;
                    case "Thực hiện":
                        artist = $(a).next().text();
                        break;
                }
            }
            return createManga({
                id: mangaId,
                author: creator,
                artist: artist,
                desc: desc,
                titles: [$('h1.title-detail').text()],
                image: 'https://lxhentai.com' + $('.col-md-8 > .row > .col-md-4 > img').attr('src'),
                status: status,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: true,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $("#listChuong > ul > .row:not(:first-child) > div.col-5").toArray().reverse()) {
                i++;
                let time = $($(obj).next()).text().trim().split(' ');
                let day = time[1].split('/');
                let h = time[0];
                chapters.push(createChapter({
                    id: 'https://lxhentai.com' + $('a', obj).attr('href'),
                    chapNum: i,
                    name: $('a', obj).text(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(day[1] + '/' + day[0] + '/' + day[2] + ' ' + h)
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: chapterId,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            const list = $('#content_chap p img').toArray().length === 0 ? $('#content_chap div:not(.text-center) img').toArray()
                : $('#content_chap p img').toArray();
            for (let obj of list) {
                let link = obj.attribs['src'].includes('http') ? obj.attribs['src'] : 'https:' + obj.attribs['src'];
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
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới cập nhật",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Hot nhất",
                view_more: true,
            });
            sectionCallback(newUpdated);
            sectionCallback(hot);
            //New Updates
            let request = createRequestObject({
                url: 'https://lxhentai.com/story/index.php',
                method: "GET",
            });
            let newUpdatedItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray().splice(0, 15)) {
                const title = $('a', manga).last().text().trim();
                const id = (_a = $('a', manga).last().attr('href')) !== null && _a !== void 0 ? _a : title;
                const image = $('div', manga).first().css('background');
                const bg = image === null || image === void 0 ? void 0 : image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
                const sub = $('a', manga).first().text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: 'https://lxhentai.com' + id,
                    image: 'https://lxhentai.com' + bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //Hot
            request = createRequestObject({
                url: 'https://lxhentai.com/story/index.php?hot',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(html);
            for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray().splice(0, 15)) {
                const title = $('a', manga).last().text().trim();
                const id = (_b = $('a', manga).last().attr('href')) !== null && _b !== void 0 ? _b : title;
                const image = $('div', manga).first().css('background');
                const bg = image === null || image === void 0 ? void 0 : image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
                const sub = $('a', manga).first().text().trim();
                hotItems.push(createMangaTile({
                    id: 'https://lxhentai.com' + id,
                    image: 'https://lxhentai.com' + bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //Featured
            request = createRequestObject({
                url: 'https://lxhentai.com/',
                method: "GET",
            });
            let featuredItems = [];
            data = yield this.requestManager.schedule(request, 1);
            html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(html);
            for (let manga of $('.truyenHot .gridSlide > div').toArray()) {
                const title = $('.slideName > a', manga).text().trim();
                const id = (_c = $('.slideName > a', manga).attr('href')) !== null && _c !== void 0 ? _c : title;
                const image = $('.itemSlide', manga).first().css('background');
                const bg = image === null || image === void 0 ? void 0 : image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
                const sub = $('.newestChapter', manga).text().trim();
                featuredItems.push(createMangaTile({
                    id: 'https://lxhentai.com' + id,
                    image: 'https://lxhentai.com' + bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "hot":
                    url = `https://lxhentai.com/story/index.php?hot&p=${page}`;
                    break;
                case "new_updated":
                    url = `https://lxhentai.com/story/index.php?p=${page}`;
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
            const html = Buffer.from(createByteArray(response.rawData)).toString();
            const $ = this.cheerio.load(html);
            const manga = LXHentaiParser_1.parseViewMore($);
            metadata = !LXHentaiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                url: query.title ? `https://lxhentai.com/story/search.php?key=${encodeURI(query.title)}&p=${page}` : `${tags[0]}&p=${page}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            const tiles = LXHentaiParser_1.parseSearch($, query);
            metadata = !LXHentaiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://lxhentai.com/#`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            //the loai
            for (const tag of $('.col-6 a', '#theloaiMob').toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = 'https://lxhentai.com/' + $(tag).attr('href')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://lxhentai.com/'
        };
    }
}
exports.LXHentai = LXHentai;
