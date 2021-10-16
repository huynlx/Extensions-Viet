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
exports.Thienhatruyen = exports.ThienhatruyenInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const ThienhatruyenParser_1 = require("./ThienhatruyenParser");
const DOMAIN = 'https://thienhatruyen.com/';
const method = 'GET';
exports.ThienhatruyenInfo = {
    version: '2.0.0',
    name: 'Thienhatruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Thienhatruyen',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Thienhatruyen extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 2,
            requestTimeout: 10000
        });
    }
    getMangaShareUrl(mangaId) { return `${DOMAIN}${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            let tags = [];
            let creator = [];
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.shortDetail').text();
            for (const t of $('.list-cate > a').toArray()) {
                const genre = $('li', t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const test = $('.aboutThisComic > li:nth-child(2) > a').text();
            for (const obj of $('.aboutThisComic > li:nth-child(2) > a').toArray()) {
                creator.push($(obj).text().trim());
            }
            ;
            // status = $('.info-item:nth-child(4) > .info-value > a').text().toLowerCase().includes("đang tiến hành") ? 1 : 0;
            const image = $('.cover > img').attr('data-src');
            return createManga({
                id: mangaId,
                author: !test ? $('.aboutThisComic > li:nth-child(2)').children().remove().end().text() : creator.join(', '),
                artist: !test ? $('.aboutThisComic > li:nth-child(2)').children().remove().end().text() : creator.join(', '),
                desc,
                titles: [ThienhatruyenParser_1.decodeHTMLEntity($('.detail > h1').text().trim())],
                image: image !== null && image !== void 0 ? image : "https://i.imgur.com/GYUxEX8.png",
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
                url: `${DOMAIN}${mangaId}`,
                method,
            });
            var i = 0;
            const response = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(response.rawData)).toString();
            let $ = this.cheerio.load(html);
            const chapters = [];
            // const collectedIds: any = [];
            for (const obj of $("#scrollbar a").toArray().reverse()) {
                const getTime = $('span.name > span.views', obj).text().trim().split(' ');
                const time = {
                    date: getTime[0],
                    time: getTime[1].split('-')[0].trim()
                };
                const arrDate = time.date.split(/\-/);
                const fixDate = [arrDate[1], arrDate[0], arrDate[2]].join('/');
                const finalTime = new Date(fixDate + ' ' + time.time);
                let chapNum = parseFloat($('span.name > span.titleComic', obj).text().trim().split(" ")[1]); //a:,a-b,a
                // if (!collectedIds.includes(chapNum)) {
                i++;
                chapters.push(createChapter({
                    id: $(obj).attr('href'),
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: $('span.name > span.titleComic', obj).text().trim(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: finalTime
                }));
                //     collectedIds.push(chapNum);
                // }
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
            for (let obj of $('#lightgallery2 > img').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                let link = obj.attribs['src'];
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
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            let hot = createHomeSection({
                id: 'hot',
                title: "ĐANG HOT",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "MỚI NHẤT",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "XEM NHIỀU",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(view);
            ///Get the section data
            //Hot
            let url = '';
            let request = createRequestObject({
                url: `${DOMAIN}danh-muc/dang-hot`,
                method: "GET",
            });
            let hotItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray().splice(0, 40)) {
                let title = $(`.detail > h3 > a`, obj).text().trim();
                let subtitle = $(`.chapters a`, obj).attr('title');
                const image = $(`.cover img`, obj).attr('data-src');
                let id = (_b = (_a = $(`.detail > h3 > a`, obj).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/").pop()) !== null && _b !== void 0 ? _b : title;
                if (!id || !subtitle)
                    continue;
                hotItems.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
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
            //New Updates
            url = '';
            request = createRequestObject({
                url: `${DOMAIN}danh-muc/moi-nhat`,
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(html);
            for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray().splice(0, 40)) {
                let title = $(`.detail > h3 > a`, obj).text().trim();
                let subtitle = $(`.chapters a`, obj).attr('title');
                const image = $(`.cover img`, obj).attr('data-src');
                let id = (_d = (_c = $(`.detail > h3 > a`, obj).attr("href")) === null || _c === void 0 ? void 0 : _c.split("/").pop()) !== null && _d !== void 0 ? _d : title;
                if (!id || !subtitle)
                    continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
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
            //view
            url = DOMAIN;
            request = createRequestObject({
                url: `${DOMAIN}danh-muc/xem-nhieu`,
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(html);
            for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray().splice(0, 40)) {
                let title = $(`.detail > h3 > a`, obj).text().trim();
                let subtitle = $(`.chapters a`, obj).attr('title');
                const image = $(`.cover img`, obj).attr('data-src');
                let id = (_f = (_e = $(`.detail > h3 > a`, obj).attr("href")) === null || _e === void 0 ? void 0 : _e.split("/").pop()) !== null && _f !== void 0 ? _f : title;
                if (!id || !subtitle)
                    continue;
                viewItems.push(createMangaTile({
                    id: id,
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
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
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "hot":
                    url = `${DOMAIN}danh-muc/dang-hot?page=${page}`;
                    break;
                case "new_updated":
                    url = `${DOMAIN}danh-muc/moi-nhat?page=${page}`;
                    break;
                case "view":
                    url = `${DOMAIN}danh-muc/xem-nhieu?page=${page}`;
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
            let html = Buffer.from(createByteArray(response.rawData)).toString();
            let $ = this.cheerio.load(html);
            const manga = ThienhatruyenParser_1.parseViewMore($);
            metadata = !ThienhatruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const search = {
                cate: "",
                author: "",
                translater: "",
                complete: "",
                sort: ""
            };
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'author':
                        search.author = (value.split(".")[1]);
                        break;
                    case 'translater':
                        search.translater = (value.split(".")[1]);
                        break;
                    case 'complete':
                        search.complete = (value.split(".")[1]);
                        break;
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break;
                }
            });
            const request = createRequestObject({
                url: query.title ? encodeURI(`${DOMAIN}tim-kiem?q=${(_d = query.title) !== null && _d !== void 0 ? _d : ''}`) : `${DOMAIN}danh-muc/tat-ca-truyen?cate=${search.cate}&writer=${search.author}&translator=${search.translater}&status=${search.complete}&sort=${search.sort}`,
                method: "GET",
                param: `&page=${page}`
            });
            const data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            const tiles = ThienhatruyenParser_1.parseSearch($);
            metadata = !ThienhatruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}danh-muc/tat-ca-truyen`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(response.rawData)).toString();
            let $ = this.cheerio.load(html);
            const arrayTags = [];
            const arrayTags2 = [];
            const arrayTags3 = [];
            const arrayTags4 = [];
            const arrayTags5 = [];
            //the loai
            for (const tag of $('option', '#formAdvance > .column-search:nth-child(1) > select').toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = 'cate.' + $(tag).attr('value')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            //tac gia
            for (const tag of $('option', '#formAdvance > .column-search:nth-child(2) > select').toArray()) {
                const label = $(tag).text().trim();
                const id = (_b = 'author.' + $(tag).attr('value')) !== null && _b !== void 0 ? _b : label;
                if (!id || !label)
                    continue;
                arrayTags2.push({ id: id, label: label });
            }
            //nhom dich
            for (const tag of $('option', '#formAdvance > .column-search:nth-child(3) > select').toArray()) {
                const label = $(tag).text().trim();
                const id = (_c = 'translater.' + $(tag).attr('value')) !== null && _c !== void 0 ? _c : label;
                if (!id || !label)
                    continue;
                arrayTags3.push({ id: id, label: label });
            }
            //tinh trang
            for (const tag of $('option', '#formAdvance > .column-search:nth-child(4) > select').toArray()) {
                const label = $(tag).text().trim();
                const id = (_d = 'complete.' + $(tag).attr('value')) !== null && _d !== void 0 ? _d : label;
                if (!id || !label)
                    continue;
                arrayTags4.push({ id: id, label: label });
            }
            //sap xep
            for (const tag of $('option', '#formAdvance > .column-search:nth-child(5) > select').toArray()) {
                const label = $(tag).text().trim();
                const id = (_e = 'sort.' + $(tag).attr('value')) !== null && _e !== void 0 ? _e : label;
                if (!id || !label)
                    continue;
                arrayTags5.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Tác giả', tags: arrayTags2.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Nhóm dịch', tags: arrayTags3.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Tình trạng', tags: arrayTags4.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Sắp xếp', tags: arrayTags5.map(x => createTag(x)) }),
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
exports.Thienhatruyen = Thienhatruyen;
