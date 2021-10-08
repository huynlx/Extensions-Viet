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
exports.Gaito = exports.GaitoInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const GaitoParser_1 = require("./GaitoParser");
const method = 'GET';
exports.GaitoInfo = {
    version: '1.0.0',
    name: 'Gai.to',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Gai.to',
    websiteBaseURL: `https://www.gaito.me/truyen-hentai/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class Gaito extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `https://www.gaito.me/truyen-hentai/comic/${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.gaito.me/manga/comics/${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            let tags = [];
            let creator = json.author;
            let status = json.status; //completed, 1 = Ongoing
            let desc = json.description;
            for (const t of json.genres) {
                const genre = t.name;
                const id = t.id;
                tags.push(createTag({ label: genre, id }));
            }
            const image = json.cover.data.dimensions.original.url;
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [json.title],
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
                url: `https://api.gaito.me/manga/chapters?comicId=${mangaId}&mode=by-comic&orderBy=bySortOrderDown`,
                method,
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const chapters = [];
            for (const obj of json) {
                let id = obj.id;
                let chapNum = Number(obj.sortOrder);
                let name = obj.title;
                chapters.push(createChapter({
                    id,
                    chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `https://api.gaito.me/manga/pages?chapterId=${chapterId}&mode=by-chapter`,
                method
            });
            const data = yield this.requestManager.schedule(request, 1);
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const pages = [];
            for (let obj of json) {
                let link = obj.image.dimensions.original.url;
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
        return __awaiter(this, void 0, void 0, function* () {
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới nhất",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Thích nhất",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(view);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://api.gaito.me/manga/comics?limit=20&offset=0&sort=latest',
                method: "GET",
            });
            let newUpdatedItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            var element = '';
            const check = [];
            for (element of json) {
                let title = element.title;
                let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
                let id = element.id;
                if (!check.includes(title)) {
                    newUpdatedItems.push(createMangaTile({
                        id: id !== null && id !== void 0 ? id : "",
                        image: image !== null && image !== void 0 ? image : "",
                        title: createIconText({
                            text: title !== null && title !== void 0 ? title : ""
                        })
                    }));
                    check.push(title);
                }
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //view
            request = createRequestObject({
                url: 'https://api.gaito.me/manga/comics?limit=20&offset=0&sort=top-rated',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            var element = '';
            const check2 = [];
            for (element of json) {
                let title = element.title;
                let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
                let id = element.id;
                if (!check2.includes(title)) {
                    newAddItems.push(createMangaTile({
                        id: id !== null && id !== void 0 ? id : "",
                        image: image !== null && image !== void 0 ? image : "",
                        title: createIconText({
                            text: title !== null && title !== void 0 ? title : ""
                        })
                    }));
                    check2.push(title);
                }
            }
            view.items = newAddItems;
            sectionCallback(view);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 0;
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://api.gaito.me/manga/comics?limit=20&offset=${page}&sort=latest`;
                    select = 1;
                    break;
                case "view":
                    url = `https://api.gaito.me/manga/comics?limit=20&offset=${page}&sort=top-rated`;
                    select = 2;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            let manga = GaitoParser_1.parseViewMore(json, select);
            metadata = { page: page + 20 };
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 0;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const request = createRequestObject({
                url: encodeURI(`https://api.gaito.me/manga/comics?genreId=${tags[0]}&limit=20&offset=${page}&sort=latest`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            const tiles = GaitoParser_1.parseSearch(json);
            metadata = { page: page + 20 };
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const url = `https://api.gaito.me/ext/genres?plugin=manga`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            //the loai
            for (const tag of json) {
                const label = tag.name;
                const id = tag.id;
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            const tagSections = [createTagSection({ id: '0', label: 'Thể Loại Hentai', tags: tags.map(x => createTag(x)) })];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://www.gaito.me/'
        };
    }
}
exports.Gaito = Gaito;
