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
exports.Truyen210 = exports.Truyen210Info = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Truyen210Parser_1 = require("./Truyen210Parser");
const method = 'GET';
exports.Truyen210Info = {
    version: '1.0.0',
    name: 'Truyen210',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyen210',
    websiteBaseURL: `https://truyen210.net/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class Truyen210 extends paperback_extensions_common_1.Source {
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
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = $('.col-full > .mt-author > ul > li > a').text().trim();
            let status = $('.col-full > .meta-data:nth-child(4)').text().trim(); //completed, 1 = Ongoing
            let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $("#showless").text().trim() !== '' ? $("#showless").text().trim() : $('.summary-content > p:nth-child(3)').text().trim();
            for (const t of $('.col-full > .meta-data:nth-child(6) > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_b = $('.manga-thumb > img').attr('data-original')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc.replace(/ +(?= )/g, '').replace(/\n/g, ''),
                titles: [$('.headline > h1').text().trim()],
                image: image,
                status: statusFinal,
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
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            var i = 0;
            for (const obj of $('#chapters-list-content li:not(:first-child)').toArray().reverse()) {
                i++;
                let id = $('span:nth-child(1) > a', obj).attr('href');
                let chapNum = Number($('span:nth-child(1) > a', obj).text().trim().split(' ')[1]);
                let name = $('span:nth-child(1) > a', obj).text().trim();
                let time = $('.time', obj).text().trim().split('-');
                chapters.push(createChapter({
                    id,
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(time[1] + '/' + time[0] + '/' + time[2])
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
            for (let obj of $('.box-chapter-content > img').toArray()) {
                let link = (_a = $(obj).attr('src')) !== null && _a !== void 0 ? _a : "";
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới nhất",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Truyện đang hot",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(view);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://truyen210.net/danh-sach-truyen',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            const check = [];
            for (const element of $('li', '.manga-list').toArray().splice(0, 20)) {
                let title = $('.manga-info > h3 > a', element).text().trim();
                let image = (_a = $('.manga-thumb > img', element).attr('data-original')) !== null && _a !== void 0 ? _a : "";
                let id = $('a', element).attr('href');
                let subtitle = $(`.chapter > a`, element).text().trim();
                if (!check.includes(title)) {
                    newUpdatedItems.push(createMangaTile({
                        id: id !== null && id !== void 0 ? id : "",
                        image: image !== null && image !== void 0 ? image : "",
                        title: createIconText({ text: title }),
                        subtitleText: createIconText({ text: subtitle }),
                    }));
                    check.push(title);
                }
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //hot
            request = createRequestObject({
                url: 'https://truyen210.net/dang-hot',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            const check2 = [];
            for (const element of $('li', '.manga-list').toArray().splice(0, 20)) {
                let title = $('.manga-info > h3 > a', element).text().trim();
                let image = (_b = $('.manga-thumb > img', element).attr('data-original')) !== null && _b !== void 0 ? _b : "";
                let id = $('a', element).attr('href');
                let subtitle = $(`.chapter > a`, element).text().trim();
                if (!check2.includes(title)) {
                    newAddItems.push(createMangaTile({
                        id: id !== null && id !== void 0 ? id : "",
                        image: image !== null && image !== void 0 ? image : "",
                        title: createIconText({ text: title }),
                        subtitleText: createIconText({ text: subtitle }),
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
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://truyen210.net/danh-sach-truyen?page=${page}`;
                    select = 1;
                    break;
                case "view":
                    url = `https://truyen210.net/dang-hot?page=${page}`;
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
            let $ = this.cheerio.load(data.data);
            let manga = Truyen210Parser_1.parseViewMore($);
            metadata = !Truyen210Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI(`https://truyen210.net/tim-kiem?q=${query.title}&page=${page}`) : (`${tags[0]}?page=${page}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = Truyen210Parser_1.parseSearch($);
            metadata = !Truyen210Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const url = `https://truyen210.net/`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.manga-box-cat-content > a').toArray()) {
                const label = $(tag).text().trim();
                const id = $(tag).attr('href');
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
            referer: 'https://truyen210.net/'
        };
    }
}
exports.Truyen210 = Truyen210;
