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
const DOMAIN = 'https://truyentranhaudio.online/';
const method = 'GET';
exports.LXHentaiInfo = {
    version: '3.0.0',
    name: 'LXHentai',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from LXHentai',
    websiteBaseURL: `https://lxhentai.com/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
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
    getMangaShareUrl(mangaId) { return `${DOMAIN}/${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${mangaId}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 10);
            let $ = this.cheerio.load(data.data); //lỗi từ dòng này
            let tags = [];
            // let creator = [];
            // let status = 1; //completed, 1 = Ongoing
            // let desc = $('.story-detail-info').text();
            // for (const t of $('a', '.list01').toArray()) {
            //     const genre = $(t).text().trim()
            //     const id = $(t).attr('href') ?? genre
            //     tags.push(createTag({ label: genre, id }));
            // }
            // for (const c of $('a', '.txt > p:nth-of-type(1)').toArray()) {
            //     const name = $(c).text().trim()
            //     creator.push(name);
            // }
            // status = $('.txt > p:nth-of-type(2)').text().toLowerCase().includes("đang cập nhật") ? 1 : 0;
            // const image = $('.left > img').attr('src') ?? "";
            return createManga({
                id: mangaId,
                author: 'huynh',
                artist: 'huynh',
                desc: '',
                titles: [$('h1.title-detail').text()],
                image: 'https://lxhentai.com' + $('.col-md-8 > .row > .col-md-4 > img').attr('src'),
                status: 1,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
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
            const chapters = [];
            var i = 0;
            for (const obj of $("#listChuong > ul > .row:not(:first-child) > div.col-5").toArray().reverse()) {
                i++;
                chapters.push(createChapter({
                    id: 'https://lxhentai.com' + $('a', obj).attr('href'),
                    chapNum: i,
                    name: $('a', obj).text(),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date('09/10/2021')
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
            for (let obj of $('#content_chap img').toArray()) {
                let link = 'https:' + obj.attribs['src'];
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "New Updates",
                view_more: true,
            });
            sectionCallback(newUpdated);
            //New Updates
            let request = createRequestObject({
                url: 'https://lxhentai.com/story/index.php?hot',
                method: "GET",
            });
            let newUpdatedItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray()) {
                console.log($('a', manga).last().text().trim());
                console.log($('div', manga).first().css('background'));
                console.log($('a', manga).first().text().trim());
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
            // console.log("New Updates: ");
            // console.log(newUpdatedItems);
            // console.log(data.data);
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
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
                    url = `https://lxhentai.com/story/index.php?p=${page}`;
                    break;
                // case "new_added":
                //     url = `https://lxhentai.com/story/cat.php?id=57&p=${page}`;
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
            const manga = LXHentaiParser_1.parseViewMore($);
            metadata = !LXHentaiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                category: '',
                country: "0",
                status: "-1",
                minchapter: "0",
                sort: "0"
            };
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const category = [];
            tags.map((value) => {
                if (value.indexOf('.') === -1) {
                    category.push(value);
                }
                else {
                    switch (value.split(".")[0]) {
                        case 'minchapter':
                            search.minchapter = (value.split(".")[1]);
                            break;
                        case 'country':
                            search.country = (value.split(".")[1]);
                            break;
                        case 'sort':
                            search.sort = (value.split(".")[1]);
                            break;
                        case 'status':
                            search.status = (value.split(".")[1]);
                            break;
                    }
                }
            });
            search.category = (category !== null && category !== void 0 ? category : []).join(",");
            const request = createRequestObject({
                url: query.title ? `${DOMAIN}tim-kiem/trang-${page}.html` : `${DOMAIN}tim-kiem-nang-cao/trang-${page}.html`,
                method: "GET",
                param: encodeURI(`?q=${(_d = query.title) !== null && _d !== void 0 ? _d : ''}&category=${search.category}&country=${search.country}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}`)
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = LXHentaiParser_1.parseSearch($);
            metadata = !LXHentaiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}tim-kiem-nang-cao.html`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            const arrayTags2 = [];
            const arrayTags3 = [];
            const arrayTags4 = [];
            const arrayTags5 = [];
            //the loai
            for (const tag of $('div.genre-item', 'div.col-sm-10').toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = $('span', tag).attr('data-id')) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            //quoc gia
            for (const tag of $('option', 'select#country').toArray()) {
                const label = $(tag).text().trim();
                const id = (_b = 'country.' + $(tag).attr('value')) !== null && _b !== void 0 ? _b : label;
                if (!id || !label)
                    continue;
                arrayTags2.push({ id: id, label: label });
            }
            //tinh trang
            for (const tag of $('option', 'select#status').toArray()) {
                const label = $(tag).text().trim();
                const id = (_c = 'status.' + $(tag).attr('value')) !== null && _c !== void 0 ? _c : label;
                if (!id || !label)
                    continue;
                arrayTags3.push({ id: id, label: label });
            }
            //so luong chuong
            for (const tag of $('option', 'select#minchapter').toArray()) {
                const label = $(tag).text().trim();
                const id = (_d = 'minchapter.' + $(tag).attr('value')) !== null && _d !== void 0 ? _d : label;
                if (!id || !label)
                    continue;
                arrayTags4.push({ id: id, label: label });
            }
            //sap xep
            for (const tag of $('option', 'select#sort').toArray()) {
                const label = $(tag).text().trim();
                const id = (_e = 'sort.' + $(tag).attr('value')) !== null && _e !== void 0 ? _e : label;
                if (!id || !label)
                    continue;
                arrayTags5.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại Truyện', tags: arrayTags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Quốc Gia (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Số Lượng Chương (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Sắp xếp (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
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
