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
exports.HentaiVip = exports.HentaiVipInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HentaiVipParser_1 = require("./HentaiVipParser");
const method = 'GET';
exports.HentaiVipInfo = {
    version: '1.0.0',
    name: 'HentaiVip',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVip',
    websiteBaseURL: `https://hentaivn.vip/`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class HentaiVip extends paperback_extensions_common_1.Source {
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
            let creator = $('.author > i > a').text().trim();
            let status = $('.tsinfo  > .imptdt:first-child > i').text().trim(); //completed, 1 = Ongoing
            let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $(".comic-description > .inner").text().trim();
            for (const t of $('.genre > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_b = $('.comic-info .book > img').attr('src')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.info > h1').text().trim()],
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
            for (const obj of $('.bixbox > .chap-list > .d-flex ').toArray().reverse()) {
                i++;
                let id = $('a', obj).first().attr('href');
                let name = $('a > span:first-child', obj).text().trim();
                let cc = $('a > span:first-child', obj).text().trim();
                let chapNum = Number(cc.includes('Chapter') ? cc.split('Chapter')[1].trim() : 'cc');
                let time = $('a > span:last-child', obj).text().trim().split('/');
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
            for (let obj of $('.content-text img').toArray()) {
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
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let view = createHomeSection({
                id: 'view',
                title: "Truyện Hentai Đề Cử",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện Hentai Mới",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Hentai Hot",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(view);
            sectionCallback(newUpdated);
            sectionCallback(hot);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://hentaivn.vip/truyen-hentai-moi/',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('div.col-6', '.form-row').toArray().splice(0, 20)) {
                let title = $('.entry > a', element).last().text().trim();
                let image = (_a = $('.entry > a > img', element).attr('src')) !== null && _a !== void 0 ? _a : "";
                let id = $('.entry > a', element).first().attr('href');
                let subtitle = $(`.date-time`, element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //hot
            request = createRequestObject({
                url: 'https://hentaivn.vip/truyen-hot/truyen-hot-nam/',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('div.col-6', '.form-row').toArray().splice(0, 20)) {
                let title = $('.entry > a', element).last().text().trim();
                let image = (_b = $('.entry > a > img', element).attr('src')) !== null && _b !== void 0 ? _b : "";
                let id = $('.entry > a', element).first().attr('href');
                let subtitle = $(`.date-time`, element).text().trim();
                hotItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //đề cử
            request = createRequestObject({
                url: 'https://hentaivn.vip/',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.entry ', '#girl .comics').toArray()) {
                let title = $('.name', element).text().trim();
                let image = (_c = $('a > img', element).attr('src')) !== null && _c !== void 0 ? _c : "";
                let id = $('a', element).first().attr('href');
                let subtitle = $(`.date-time`, element).text().trim();
                viewItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            view.items = viewItems;
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
                    url = `https://hentaivn.vip/truyen-hentai-moi/page/${page}/`;
                    select = 1;
                    break;
                case "hot":
                    url = `https://hentaivn.vip/truyen-hot/truyen-hot-nam/page/${page}/`;
                    select = 2;
                    break;
                // case "view":
                //     url = `https://vlogtruyen.net/de-nghi/pho-bien/xem-nhieu?page=${page}`;
                //     select = 3;
                //     break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let manga = HentaiVipParser_1.parseViewMore($);
            metadata = !HentaiVipParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI(`https://hentaivn.vip/truyen-hentai-moi/page/${page}/?q=${query.title}`) :
                    tags[0] + `page/${page}/`,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = HentaiVipParser_1.parseSearch($);
            metadata = { page: page + 1 };
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const url = `https://hentaivn.vip/`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.genre a').toArray()) {
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
            referer: 'https://hentaivn.vip/'
        };
    }
}
exports.HentaiVip = HentaiVip;
