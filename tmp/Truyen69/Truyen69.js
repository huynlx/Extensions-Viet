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
exports.Truyen69 = exports.Truyen69Info = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Truyen69Parser_1 = require("./Truyen69Parser");
const DOMAIN = 'https://www.truyen69.ml/';
const method = 'GET';
exports.Truyen69Info = {
    version: '1.0.0',
    name: 'Truyen69',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyen69',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class Truyen69 extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 3000
        });
        this.Slg = '';
    }
    getMangaShareUrl(mangaId) { return `${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            // let html = Buffer.from(createByteArray(data.rawData)).toString()
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let status = $('.list-info > li:nth-child(2) b').text().includes('Hoàn thành') ? 0 : 1;
            let desc = 'Xem là biết :))';
            for (const t of $('.list01.li03 > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_b = (_a = $(t).attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_c = 'https://www.truyen69.ml/' + $('.wrap-content-image > img').attr('src')) !== null && _c !== void 0 ? _c : "fuck";
            const creator = $('.list-info > li:nth-child(1) a').text();
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc,
                titles: [$('.wrap-content-info > .title').text()],
                image: image,
                status,
                hentai: true,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method,
            });
            var i = 0;
            const response = yield this.requestManager.schedule(request, 1);
            var dt = (_a = response.data.match(/Data_LstC = (.*);/)) === null || _a === void 0 ? void 0 : _a[1];
            this.Slg = (_c = (_b = response.data.match(/Slg = (.*);/)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : "";
            var json = JSON.parse(dt !== null && dt !== void 0 ? dt : "");
            const chapters = [];
            for (const obj of json) {
                i++;
                var chapNum = parseFloat(obj.Cn.split(' ')[1]);
                chapters.push(createChapter({
                    id: "https://www.truyen69.ml/" + this.Slg + "- chuong -" + obj.Cid + ".html" + "::" + obj.Cid,
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: obj.Cn,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: 'https://www.truyen69.ml/app/manga/controllers/cont.chapterContent.php',
                method: 'post',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data: {
                    'action': 'chapterContent',
                    'slug': this.Slg.replace(/['"]+/g, ''),
                    'loaichap': '1',
                    'chapter': `${chapterId.split("::")[1]}`
                }
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('img:not(:first-child):not(:last-child)').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                let link = obj.attribs['src'].trim();
                pages.push(link.includes('http') ? link : 'https://www.truyen69.ml' + link);
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
            let hot = createHomeSection({
                id: 'hot',
                title: "TRUYỆN HOT",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "TRUYỆN MỚI CẬP NHẬT",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "TRUYỆN ĐÃ HOÀN THÀNH",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            // Hot
            let request = createRequestObject({
                url: 'https://www.truyen69.ml/danh-sach-truyen.html?status=0&sort=views',
                method: "GET",
            });
            let popular = [];
            let data = yield this.requestManager.schedule(request, 1);
            var dt = (_a = data.data.match(/Data_DST = (.*);/)) === null || _a === void 0 ? void 0 : _a[1];
            var json = JSON.parse(dt !== null && dt !== void 0 ? dt : "");
            for (let manga of json) {
                const title = manga.manga_Name;
                const id = 'https://www.truyen69.ml' + manga.manga_Url;
                const image = 'https://www.truyen69.ml' + manga.manga_Cover;
                const sub = manga.manga_LChap;
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: sub }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            //New Updates
            request = createRequestObject({
                url: 'https://www.truyen69.ml/danh-sach-truyen.html?status=0&sort=last_update',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            var dt = (_b = data.data.match(/Data_DST = (.*);/)) === null || _b === void 0 ? void 0 : _b[1];
            var json = JSON.parse(dt !== null && dt !== void 0 ? dt : "");
            for (let manga of json) {
                const title = manga.manga_Name;
                const id = 'https://www.truyen69.ml' + manga.manga_Url;
                const image = 'https://www.truyen69.ml' + manga.manga_Cover;
                const sub = manga.manga_LChap;
                // if (!id || !subtitle) continue;
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
            //completed
            request = createRequestObject({
                url: 'https://www.truyen69.ml/danh-sach-truyen.html?status=1&sort=id',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            var dt = (_c = data.data.match(/Data_DST = (.*);/)) === null || _c === void 0 ? void 0 : _c[1];
            var json = JSON.parse(dt !== null && dt !== void 0 ? dt : "");
            for (let manga of json) {
                const title = manga.manga_Name;
                const id = 'https://www.truyen69.ml' + manga.manga_Url;
                const image = 'https://www.truyen69.ml' + manga.manga_Cover;
                const sub = manga.manga_LChap;
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
            sectionCallback(newAdded);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            let url = '';
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=&sort=last_update`;
                    break;
                case "new_added":
                    url = `https://www.truyen69.ml/danh-sach-truyen.html?status=1&page=${page}&name=&genre=&sort=id`;
                    break;
                case "hot":
                    url = `https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=&sort=views`;
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
            var dt = (_b = response.data.match(/Data_DST = (.*);/)) === null || _b === void 0 ? void 0 : _b[1];
            var json = dt !== '' ? JSON.parse(dt !== null && dt !== void 0 ? dt : "") : [];
            const manga = Truyen69Parser_1.parseViewMore(json);
            metadata = !Truyen69Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const request = createRequestObject({
                url: query.title ? encodeURI(`https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=${query.title}&genre=&sort=last_update`)
                    : tags[0] !== 'Tất cả' ? encodeURI(`https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=${tags[0]}&sort=last_update`)
                        : encodeURI(`https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=&sort=name`),
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(data.data);
            var dt = (_d = data.data.match(/Data_DST = (.*);/)) === null || _d === void 0 ? void 0 : _d[1];
            var json = dt !== '' ? JSON.parse(dt !== null && dt !== void 0 ? dt : "") : [];
            const tiles = Truyen69Parser_1.parseSearch(json);
            metadata = !Truyen69Parser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            //the loai
            for (const tag of $('#list_theloai > a').toArray()) {
                arrayTags.push({ id: $(tag).text().trim(), label: $(tag).text().trim() });
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
exports.Truyen69 = Truyen69;
