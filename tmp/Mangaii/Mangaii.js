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
exports.Mangaii = exports.MangaiiInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MangaiiParser_1 = require("./MangaiiParser");
const DOMAIN = 'https://mangaii.com/';
const method = 'GET';
exports.MangaiiInfo = {
    version: '1.0.0',
    name: 'Mangaii',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Mangaii',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Mangaii extends paperback_extensions_common_1.Source {
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
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]).props.pageProps.comic;
            let tags = [];
            let status = (dt.status === 'ongoing') ? 1 : 0;
            let desc = dt.description;
            for (const t of dt.genres) {
                const genre = t.name;
                const id = `https://mangaii.com/genre/${t.slug}`;
                tags.push(createTag({ label: genre, id }));
            }
            const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${dt.cover_image}&w=256&q=100`;
            const creator = '';
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc,
                titles: [dt.name],
                image: image,
                status,
                hentai: false,
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
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]).props.pageProps.comic;
            const chapters = [];
            for (const obj of dt.chapters) {
                chapters.push(createChapter({
                    id: `https://mangaii.com/comic/${dt.slug}/${obj.slug}`,
                    chapNum: obj.number,
                    name: obj.name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: MangaiiParser_1.convertTime(obj.created_at)
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
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]).props.pageProps.comic;
            const pages = [];
            for (let obj of dt.chapter.images.split(',_,')) {
                let link = `https://s3-hcm-r1.longvan.net/mangaii-s4/chapters/${obj}`;
                pages.push((link));
            }
            console.log(pages);
            console.log('cc');
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
                title: "DÀNH CHO BẠN",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "MỚI CẬP NHẬT",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "TÁC PHẨM MỚI",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            // sectionCallback(newAdded);
            // sectionCallback(hot);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let newUpdatedItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]).props.pageProps.comics;
            for (let manga of dt.laste_comics) {
                const title = manga.name;
                const id = 'https://mangaii.com/comic/' + manga.slug;
                const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
                const sub = 'Chapter ' + manga.chapter.number;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: image,
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
            //New Added
            request = createRequestObject({
                url: 'https://truyentranh.net/comic-latest',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.content .card-list > .card').toArray()) {
                const title = $('.card-title', manga).text().trim();
                const id = (_a = $('.card-title > a', manga).attr('href')) !== null && _a !== void 0 ? _a : title;
                const image = $('.card-img', manga).attr('src');
                const sub = $('.list-chapter > li:first-child > a', manga).text().trim();
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newAdded.items = newAddItems;
            // sectionCallback(newAdded);
            // Hot
            request = createRequestObject({
                url: 'https://truyentranh.net',
                method: "GET",
            });
            let popular = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('#bottomslider .list-slider-item').toArray()) {
                const title = $('.card', manga).attr('title');
                const id = $('.card', manga).attr('href');
                const image = $('.card-img', manga).attr('src');
                const sub = $('.card-chapter', manga).text().trim();
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: sub }),
                }));
            }
            hot.items = popular;
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
                    url = `https://truyentranh.net/comic?page=${page}`;
                    break;
                case "new_added":
                    url = `https://truyentranh.net/comic-latest?page=${page}`;
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
            const manga = MangaiiParser_1.parseViewMore($);
            metadata = !MangaiiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI(`https://truyentranh.net/search?page=${page}&q=${query.title}`) : `${tags[0]}?page=${page}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = MangaiiParser_1.parseSearch($);
            metadata = !MangaiiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = DOMAIN;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            const collectedIds = [];
            //the loai
            for (const tag of $('.dropdown-menu > ul > li > a').toArray()) {
                arrayTags.push({ id: $(tag).attr('href'), label: $(tag).text().trim() });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: `${DOMAIN}`
        };
    }
}
exports.Mangaii = Mangaii;
