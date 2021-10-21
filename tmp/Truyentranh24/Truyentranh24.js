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
exports.Truyentranh24 = exports.Truyentranh24Info = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Truyentranh24Parser_1 = require("./Truyentranh24Parser");
const DOMAIN = 'https://truyentranh24.com/';
const method = 'GET';
exports.Truyentranh24Info = {
    version: '1.5.0',
    name: 'Truyentranh24',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyentranh24',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyentranh24 extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return (DOMAIN + mangaId.split("::")[0]); }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = DOMAIN + mangaId;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            // let tags: Tag[] = [];
            let creator = '';
            let statusFinal = 1;
            creator = $('.manga-author > span').text().trim();
            let dataId = $('.container').attr('data-id');
            // for (const t of $('a', test).toArray()) {
            //     const genre = $(t).text().trim();
            //     const id = $(t).attr('href') ?? genre;
            //     tags.push(createTag({ label: genre, id }));
            // }
            let status = $('.manga-status > span').text().trim(); //completed, 1 = Ongoing
            statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $(".manga-content").text();
            const image = (_a = $('.manga-thumbnail > img').attr("data-src")) !== null && _a !== void 0 ? _a : "";
            return createManga({
                id: mangaId + "::" + dataId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.manga-title').text().trim()],
                image: image.includes('http') ? image : (DOMAIN + image),
                status: statusFinal,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: false,
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: 'https://truyentranh24.com/api/mangas/' + mangaId.split("::")[1] + '/chapters?offset=0&limit=0',
                method,
                headers: {
                    'x-requested-with': 'XMLHttpRequest',
                    'referer': 'https://truyentranh24.com'
                }
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const chapters = [];
            for (const obj of json.chapters) {
                let chapNum = obj.slug.split('-')[1];
                let name = obj.views.toLocaleString() + ' lượt đọc';
                let time = obj.created_at.split(' ');
                let d = time[0].split('-');
                let t = time[1].split(':');
                chapters.push(createChapter({
                    id: DOMAIN + mangaId.split("::")[0] + '/' + obj.slug,
                    chapNum: Number(chapNum),
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(d[1] + '/' + d[2] + '/' + d[0] + ' ' + t[0] + ':' + t[1])
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
            for (let obj of $('.chapter-content img').toArray()) {
                let link = (_a = $(obj).attr('data-src')) !== null && _a !== void 0 ? _a : "";
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
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "HOT TRONG NGÀY",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "CHAP MỚI NHẤT",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "ĐỌC NHIỀU NHẤT",
                view_more: true,
            });
            let add = createHomeSection({
                id: 'add',
                title: "TRUYỆN MỚI",
                view_more: false,
            });
            let top = createHomeSection({
                id: 'top',
                title: "TOP TUẦN",
                view_more: false,
            });
            let miss = createHomeSection({
                id: 'miss',
                title: "ĐỪNG BỎ LỠ",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(featured);
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(view);
            sectionCallback(add);
            sectionCallback(top);
            sectionCallback(miss);
            ///Get the section data
            // featured
            let request = createRequestObject({
                url: 'https://truyentranh24.com',
                method: "GET",
            });
            let featuredItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (const element of $('.container-lm > section:nth-child(2) > .item-big').toArray()) {
                let title = $('.item-title', element).text().trim();
                let image = $('.item-thumbnail > img', element).attr("data-src");
                let id = (_a = $('a', element).first().attr('href').split('/')[1]) !== null && _a !== void 0 ? _a : title;
                let subtitle = $(".item-description", element).text().trim();
                // if (!id || !title) continue;
                featuredItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            // Hot
            request = createRequestObject({
                url: 'https://truyentranh24.com/top-ngay',
                method: "GET",
            });
            let popular = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray().splice(0, 12)) {
                let title = $('.item-title', element).text().trim();
                let image = $('.item-thumbnail > img', element).attr("data-src");
                let id = (_b = $('a', element).first().attr('href').split('/')[1]) !== null && _b !== void 0 ? _b : title;
                let subtitle = $("span.background-8", element).text().trim();
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            //New Updates
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
                let title = $('.item-title > a', element).text().trim();
                let image = $('.item-thumbnail > img', element).attr("data-src");
                let id = (_c = $('.item-title > a', element).attr('href').split('/')[1]) !== null && _c !== void 0 ? _c : title;
                let subtitle = $("span.background-1", element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //view
            request = createRequestObject({
                url: 'https://truyentranh24.com/truyen-hot',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray().splice(0, 12)) {
                let title = $('.item-title', element).text().trim();
                let image = $('.item-thumbnail > img', element).attr("data-src");
                let id = (_d = $('a', element).first().attr('href').split('/')[1]) !== null && _d !== void 0 ? _d : title;
                let subtitle = $("span.background-8", element).text().trim();
                viewItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            view.items = viewItems;
            sectionCallback(view);
            //add
            request = createRequestObject({
                url: 'https://truyentranh24.com/',
                method: "GET",
            });
            let addItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.container-lm > section:nth-child(3) > .new > .item-large').toArray()) {
                let title = $('.item-title', element).text().trim();
                let image = $('.item-thumbnail > img', element).attr("data-src");
                let id = (_e = $('a', element).first().attr('href').split('/')[1]) !== null && _e !== void 0 ? _e : title;
                let subtitle = $(".item-children > a:first-child > .child-name", element).text().trim() + ' | ' + $(".item-children > a:first-child > .child-update", element).text().trim();
                addItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            add.items = addItems;
            sectionCallback(add);
            //top
            request = createRequestObject({
                url: 'https://truyentranh24.com/',
                method: "GET",
            });
            let topItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.container-lm > section:nth-child(3) > .column-right > .item-large').toArray()) {
                let title = $('.item-title', element).text().trim();
                let image = $('.item-poster > img', element).attr("data-src");
                let id = (_f = $('a', element).first().attr('href').split('/')[1]) !== null && _f !== void 0 ? _f : title;
                let subtitle = $(".background-9", element).text().trim();
                topItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            top.items = topItems;
            sectionCallback(top);
            //miss
            request = createRequestObject({
                url: 'https://truyentranh24.com/',
                method: "GET",
            });
            let missItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.container-lm > section:nth-child(4) > .item-medium').toArray()) {
                let title = $('.item-title', element).text().trim();
                let image = $('.item-thumbnail > img', element).attr("data-src");
                let id = (_g = $('a', element).first().attr('href').split('/')[1]) !== null && _g !== void 0 ? _g : title;
                let subtitle = $(".background-3", element).text().trim();
                missItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            miss.items = missItems;
            sectionCallback(miss);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "hot":
                    url = `https://truyentranh24.com/top-ngay?p=${page}`;
                    select = 1;
                    break;
                case "new_updated":
                    url = `https://truyentranh24.com/chap-moi-nhat`;
                    select = 2;
                    break;
                case "view":
                    url = `https://truyentranh24.com/truyen-hot?p=${page}`;
                    select = 1;
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
            let manga = Truyentranh24Parser_1.parseViewMore($, select);
            metadata = !Truyentranh24Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI(`https://truyentranh24.com/tim-kiem/${query.title}?p=${page}`) : (`https://truyentranh24.com/` + tags[0] + `?p=${page}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = Truyentranh24Parser_1.parseSearch($);
            metadata = !Truyentranh24Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [
                {
                    id: "/danh-sach",
                    label: "Danh sách"
                }
            ];
            const url = DOMAIN;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.navbar-item-sub a').toArray()) {
                const label = $(tag).text().trim();
                const id = $(tag).attr('href');
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
            referer: DOMAIN
        };
    }
}
exports.Truyentranh24 = Truyentranh24;
