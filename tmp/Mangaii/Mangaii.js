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
            let desc = !dt.description ? $('#description').text() : dt.description;
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
            const pages = [];
            for (let obj of $('._1-mrs > img').toArray()) {
                let link = $(obj).attr('src');
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
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "# Hot là đây!",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "# Mới cập nhập!",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Bảng xếp hạng",
                view_more: false,
            });
            let news = createHomeSection({
                id: 'new',
                title: "# Mới ra mắt",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(view);
            sectionCallback(news);
            ///Get the section data
            //Get json data
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]).props.pageProps.comics;
            // Hot
            let popularItems = [];
            for (let manga of dt.translate) {
                const title = manga.name;
                const id = 'https://mangaii.com/comic/' + manga.slug;
                const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
                const sub = 'Chapter ' + manga.chapter.number;
                popularItems.push(createMangaTile({
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
            hot.items = popularItems;
            sectionCallback(hot);
            // featured
            let featuredItems = [];
            for (let manga of dt.banners.slice(1)) {
                const title = manga.name;
                const id = manga.link;
                const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fslider-banner%2F${encodeURI(manga.image)}&w=768&q=75`;
                // const sub = 'Chapter ' + manga.chapter.number;
                featuredItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //New Updates
            let newUpdatedItems = [];
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
            //view
            let newAddItems = [];
            for (let manga of dt.top_views) {
                const title = manga.name;
                const id = 'https://mangaii.com/comic/' + manga.slug;
                const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
                const sub = manga.total_views.toLocaleString() + ' views';
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
            view.items = newAddItems;
            sectionCallback(view);
            //new
            let newsItems = [];
            for (let manga of dt.new_comics) {
                const title = manga.name;
                const id = 'https://mangaii.com/comic/' + manga.slug;
                const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
                const sub = 'Chapter ' + manga.chapter.number;
                newsItems.push(createMangaTile({
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
            news.items = newsItems;
            sectionCallback(news);
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
                    url = `https://api.mangaii.com/api/v1/comics?page=${page}`;
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
            const json = JSON.parse(response.data);
            const manga = MangaiiParser_1.parseViewMore(json.data);
            metadata = json.hasMore ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI(`https://api.mangaii.com/api/v1/search?name=${query.title}&page=${page}`) : `https://api.mangaii.com/api/v1/comics?page=${page}&genre=${tags[0]}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = JSON.parse(data.data);
            const tiles = MangaiiParser_1.parseSearch(json.data);
            metadata = json.hasMore ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = 'https://mangaii.com/_next/data/fM7pdjCUFacEnYx_vhENt/vi/genre/all-qWerTy12.json?slug=all-qWerTy12';
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const json = JSON.parse(response.data).pageProps.genres;
            const arrayTags = [];
            //the loai
            for (const tag of json) {
                arrayTags.push({ id: tag.slug, label: tag.name });
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
