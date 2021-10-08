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
exports.Doctruyen3Q = exports.Doctruyen3QInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Doctruyen3QParser_1 = require("./Doctruyen3QParser");
const DOMAIN = 'https://doctruyen3q.com/';
const method = 'GET';
exports.Doctruyen3QInfo = {
    version: '2.0.0',
    name: 'Doctruyen3Q',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Doctruyen3Q',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Doctruyen3Q extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
        // override getCloudflareBypassRequest(): Request {
        //     return createRequestObject({ //https://lxhentai.com/
        //         url: 'https://manhuarock.net/',
        //         method: 'GET',
        //     }) //dit buoi lam lxhentai nua dkm, ti fix thanh medoctruyen
        // }
    }
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
            time = new Date(Date.now() - trimmed * 1000); // => mili giây (1000 ms = 1s)
        }
        else if (timeAgo.includes('phút')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('giờ')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('ngày')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('tuần')) {
            time = new Date(Date.now() - trimmed * 86400000 * 7);
        }
        else if (timeAgo.includes('tháng')) {
            time = new Date(Date.now() - trimmed * 86400000 * 7 * 4);
        }
        else if (timeAgo.includes('năm')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            if (timeAgo.includes(":")) {
                let split = timeAgo.split(' ');
                let H = split[0]; //vd => 21:08
                let D = split[1]; //vd => 25/08 
                let fixD = D.split('/');
                let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
                time = new Date(finalD + ' ' + H);
            }
            else {
                let split = timeAgo.split('-'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + split[2]);
            }
        }
        return time;
    }
    getMangaShareUrl(mangaId) { return mangaId; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = mangaId;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let statusFinal = 1;
            creator = $('.info-detail-comic > .author > .detail-info').text().trim();
            for (const t of $('.info-detail-comic > .category > .detail-info > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            let status = $('.info-detail-comic > .status > .detail-info > span').text().trim(); //completed, 1 = Ongoing
            statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $(".summary-content > p").text();
            const image = (_b = $('.image-info img').attr("src")) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.title-manga').text().trim()],
                image,
                status: statusFinal,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method,
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            for (const obj of $('#list-chapter-dt > nav > ul > li:not(:first-child)').toArray()) {
                let id = $('.chapters > a', obj).attr('href');
                let chapNum = parseFloat((_a = $('.chapters > a', obj).text()) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                let name = $('.chapters > a', obj).text().trim();
                let time = $('div:nth-child(2)', obj).text().trim();
                // let H = time[0];
                // let D = time[1].split('/');
                chapters.push(createChapter({
                    id,
                    chapNum: chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: this.convertTime(time)
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
            for (let obj of $('.list-image-detail img').toArray()) {
                let link = (_a = $(obj).attr('data-original')) !== null && _a !== void 0 ? _a : $(obj).attr('src');
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Hot",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới cập nhật",
                view_more: true,
            });
            let boy = createHomeSection({
                id: 'boy',
                title: "Truyện Tranh Con Trai",
                view_more: true,
            });
            let girl = createHomeSection({
                id: 'girl',
                title: "Truyện Tranh Con Gái ",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(featured);
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(boy);
            sectionCallback(girl);
            ///Get the section data
            //featured
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let featuredItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (const element of $('.owl-carousel .slide-item').toArray()) {
                let title = $('.slide-info > h3 > a', element).text().trim();
                let img = (_a = $('a > img', element).attr("data-src")) !== null && _a !== void 0 ? _a : $('a > img', element).attr("src");
                let id = (_b = $('.slide-info > h3 > a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
                let subtitle = $(".detail-slide > a", element).text().trim();
                featuredItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: img !== null && img !== void 0 ? img : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            // Hot
            request = createRequestObject({
                url: 'https://doctruyen3q.com/hot',
                method: "GET",
            });
            let popular = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
                let title = $('.caption > h3 > a', element).text().trim();
                let img = (_c = $('.image-item > a > img', element).attr("data-original")) !== null && _c !== void 0 ? _c : $('.image-item > a > img', element).attr('src');
                let id = (_d = $('.caption > h3 > a', element).attr('href')) !== null && _d !== void 0 ? _d : title;
                let subtitle = $("ul > li:first-child > a", element).text().trim();
                popular.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: img !== null && img !== void 0 ? img : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            //update
            request = createRequestObject({
                url: 'https://doctruyen3q.com/',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('#home > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
                let title = $('.caption > h3 > a', element).text().trim();
                let img = (_e = $('.image-item > a > img', element).attr("data-original")) !== null && _e !== void 0 ? _e : $('.image-item > a > img', element).attr('src');
                let id = (_f = $('.caption > h3 > a', element).attr('href')) !== null && _f !== void 0 ? _f : title;
                let subtitle = $("ul > li:first-child > a", element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: img !== null && img !== void 0 ? img : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //boy
            request = createRequestObject({
                url: 'https://doctruyen3q.com/truyen-con-trai',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let boyItems = [];
            for (const element of $('#male-comics > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
                let title = $('.caption > h3 > a', element).text().trim();
                let img = (_g = $('.image-item > a > img', element).attr("data-original")) !== null && _g !== void 0 ? _g : $('.image-item > a > img', element).attr('src');
                let id = (_h = $('.caption > h3 > a', element).attr('href')) !== null && _h !== void 0 ? _h : title;
                let subtitle = $("ul > li:first-child > a", element).text().trim();
                boyItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: img !== null && img !== void 0 ? img : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            boy.items = boyItems;
            sectionCallback(boy);
            //girl
            request = createRequestObject({
                url: 'https://doctruyen3q.com/truyen-con-gai',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let girlItems = [];
            for (const element of $('#female-comics > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
                let title = $('.caption > h3 > a', element).text().trim();
                let img = (_j = $('.image-item > a > img', element).attr("data-original")) !== null && _j !== void 0 ? _j : $('.image-item > a > img', element).attr('src');
                let id = (_k = $('.caption > h3 > a', element).attr('href')) !== null && _k !== void 0 ? _k : title;
                let subtitle = $("ul > li:first-child > a", element).text().trim();
                girlItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: img !== null && img !== void 0 ? img : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            girl.items = girlItems;
            sectionCallback(girl);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            switch (homepageSectionId) {
                case "hot":
                    url = `https://doctruyen3q.com/hot?page=${page}`;
                    break;
                case "new_updated":
                    url = `https://doctruyen3q.com/?page=${page}`;
                    break;
                case "boy":
                    url = `https://doctruyen3q.com/truyen-con-trai?page=${page}`;
                    break;
                case "girl":
                    url = `https://doctruyen3q.com/truyen-con-gai?page=${page}`;
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
            let manga = Doctruyen3QParser_1.parseViewMore($, homepageSectionId);
            metadata = !Doctruyen3QParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                cate: '',
                status: "2",
                sort: "1" //ngay cap nhat
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break;
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break;
                }
            });
            const request = createRequestObject({
                url: encodeURI(`https://doctruyen3q.com/tim-truyen/${search.cate}?keyword=${(_d = query.title) !== null && _d !== void 0 ? _d : ""}&sort=${search.sort}&status=${search.status}&page=${page}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = Doctruyen3QParser_1.parseSearch($);
            metadata = !Doctruyen3QParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const tags2 = [];
            const tags5 = [];
            const url = 'https://doctruyen3q.com/tim-truyen';
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.categories-detail li:not(.active) > a').toArray()) {
                const label = $(tag).text().trim();
                const id = 'cate.' + $(tag).attr('href').split('/').pop();
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            //trang thai
            for (const tag of $('#status-comic a').toArray()) {
                var label = $(tag).text().trim();
                const id = 'status.' + $(tag).attr('href').split('=')[1];
                if (!id || !label)
                    continue;
                tags5.push({ id: id, label: label });
            }
            //sap xep theo
            for (const tag of $('.list-select > a').toArray()) {
                var label = $(tag).text().trim();
                const id = 'sort.' + $(tag).attr('href').split('=')[1];
                if (!id || !label)
                    continue;
                tags2.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags2.map(x => createTag(x)) }),
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
exports.Doctruyen3Q = Doctruyen3Q;
