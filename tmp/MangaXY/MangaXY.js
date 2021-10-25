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
exports.MangaXY = exports.MangaXYInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MangaXYParser_1 = require("./MangaXYParser");
const DOMAIN = 'https://mangaxy.com/';
const method = 'GET';
exports.MangaXYInfo = {
    version: '1.0.0',
    name: 'MangaXY (TT8)',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from MangaXY',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class MangaXY extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 15000
        });
        // globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        //     return {
        //         referer: DOMAIN
        //     }
        // }
    }
    getMangaShareUrl(mangaId) { return `${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var checkCover = $(".detail-top-right img").attr("style");
            var cover = '';
            if ((checkCover === null || checkCover === void 0 ? void 0 : checkCover.indexOf('jpg')) != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
                cover = checkCover.split(/['']/)[1];
            else
                cover = "";
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $(".manga-info p").text();
            creator = $(".created-by a").text();
            for (const t of $('.top-comics-type > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: MangaXYParser_1.ucFirstAllWords(genre), id }));
            }
            var loop = $(".manga-info ul li a").toArray();
            for (var el in loop) {
                let x = loop[el];
                if ($(x).text().includes("Đang tiến hành") || $(x).text().includes("Đã hoàn thành")) {
                    status = $(x).text().toLowerCase().includes('đang') ? 1 : 0;
                    break;
                }
                else {
                    continue;
                }
            }
            const image = "https://" + cover;
            console.log(image);
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [MangaXYParser_1.decodeHTMLEntity($("h1.comics-title").text())],
                image,
                status,
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
            });
        });
    }
    getChapters(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${mangaId}`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            var el = $("#ChapList a").toArray();
            const chapters = [];
            for (var i = el.length - 1; i >= 0; i--) {
                var e = el[i];
                const name = $(".episode-title", e).text().trim();
                const timeStr = (_b = ((_a = $('.episode-date > time', e).attr('datetime')) === null || _a === void 0 ? void 0 : _a.split(" "))) !== null && _b !== void 0 ? _b : "";
                const day = timeStr[0].split('-');
                const h = timeStr[1].split(":");
                const finalDay = day[1] + '/' + day[2] + '/' + day[0];
                const finalH = h[0] + ':' + h[1];
                chapters.push(createChapter({
                    id: $(e).attr("href"),
                    chapNum: isNaN(parseFloat(name.split(" ")[1])) ? i + 1 : parseFloat(name.split(" ")[1]),
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(finalDay + ' ' + finalH)
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
            for (let obj of $('.page-chapter img').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                let link = obj.attribs['src'];
                pages.push((link.trim()));
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
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Chap mới",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện mới",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Xem nhiều",
                view_more: true,
            });
            let az = createHomeSection({
                id: 'az',
                title: "A-Z",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            sectionCallback(hot);
            sectionCallback(az);
            ///Get the section data
            //Featured
            let url = 'https://mangaxy.com/';
            let request = createRequestObject({
                url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var featuredItems = [];
            for (const obj of $('.item', '#mangaXYThucHien').toArray()) {
                var checkCover = $(".thumb", obj).attr("style");
                var cover = '';
                if ((checkCover === null || checkCover === void 0 ? void 0 : checkCover.indexOf('jpg')) != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1)
                    cover = (_b = (_a = checkCover === null || checkCover === void 0 ? void 0 : checkCover.match(/image: url\('\/\/(.+)\'\)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ""; //regex
                else
                    cover = "";
                var title = $(".name", obj).text().includes(']') ? $(".name", obj).text().split(']')[1].trim() : $(".name", obj).text().trim();
                var id = $(".thumb", obj).attr('href');
                var sub = $(".chap", obj).text();
                featuredItems.push(createMangaTile({
                    id,
                    image: "https://" + cover,
                    title: createIconText({
                        text: title.includes('-') ? title.split('-')[1].trim() : title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    })
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //New Updates
            url = 'https://mangaxy.com/search.php?andor=and&van=&sort=chap&view=thumb&act=timnangcao&ajax=true&page=1';
            request = createRequestObject({
                url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            newUpdated.items = MangaXYParser_1.parseManga($);
            sectionCallback(newUpdated);
            //New Added
            url = 'https://mangaxy.com/search.php?andor=and&sort=truyen&view=thumb&act=timnangcao&ajax=true&page=1';
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            newAdded.items = MangaXYParser_1.parseManga($);
            sectionCallback(newAdded);
            //Hot
            url = 'https://mangaxy.com/search.php?andor=and&sort=xem&view=thumb&act=timnangcao&ajax=true&page=1';
            request = createRequestObject({
                url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            hot.items = MangaXYParser_1.parseManga($);
            sectionCallback(hot);
            //A-Z
            url = 'https://mangaxy.com/search.php?andor=and&sort=ten&view=thumb&act=timnangcao&ajax=true&page=1';
            request = createRequestObject({
                url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            az.items = MangaXYParser_1.parseManga($);
            sectionCallback(az);
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
                    url = `https://mangaxy.com/search.php?andor=and&van=&sort=chap&view=thumb&act=timnangcao&ajax=true&page=${page}`;
                    break;
                case "new_added":
                    url = `https://mangaxy.com/search.php?andor=and&sort=truyen&view=thumb&act=timnangcao&ajax=true&page=${page}`;
                    break;
                case "az":
                    url = `https://mangaxy.com/search.php?andor=and&sort=ten&view=thumb&act=timnangcao&ajax=true&page=${page}`;
                    break;
                case "hot":
                    url = `https://mangaxy.com/search.php?andor=and&sort=xem&view=thumb&act=timnangcao&ajax=true&page=${page}`;
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
            const manga = MangaXYParser_1.parseViewMore($);
            metadata = manga.length !== 0 ? { page: page + 1 } : undefined;
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
                url: query.title ? encodeURI("https://mangaxy.com/search.php?andor=and&q=" + query.title + "&page=" + page + "&view=thumb&act=timnangcao&ajax=true") :
                    encodeURI(tags[0] + page),
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = MangaXYParser_1.parseSearch($);
            metadata = tiles.length !== 0 ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = "https://mangaxy.com/";
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            var element = $(".megalist > ul.col4 a").toArray();
            //the loai
            for (var el in element) {
                var book = element[el];
                const label = $(book).text().trim();
                const id = (_a = $(book).attr("href") + "page=") !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) })
            ];
            return tagSections;
        });
    }
}
exports.MangaXY = MangaXY;
