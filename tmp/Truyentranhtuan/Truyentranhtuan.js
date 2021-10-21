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
exports.Truyentranhtuan = exports.TruyentranhtuanInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyentranhtuanParser_1 = require("./TruyentranhtuanParser");
const DOMAIN = 'http://truyentranhtuan.com/';
const method = 'GET';
exports.TruyentranhtuanInfo = {
    version: '1.0.0',
    name: 'Truyentranhtuan',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyentranhtuan',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyentranhtuan extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
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
            creator = $('#infor-box span[itemprop="author"] > span[itemprop="name"]').text().trim();
            for (const t of $('p:nth-of-type(3) > a', $('#infor-box h1[itemprop="name"]').next()).toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            let status = $('p:nth-of-type(4) > a', $('#infor-box h1[itemprop="name"]').next()).text().trim(); //completed, 1 = Ongoing
            statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $("#manga-summary").text();
            const image = (_b = $('.manga-cover img').attr("src")) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: TruyentranhtuanParser_1.decodeHTMLEntity(desc),
                titles: [TruyentranhtuanParser_1.decodeHTMLEntity($('#infor-box h1[itemprop="name"]').text().trim())],
                image: encodeURI(image),
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
            const timeList = $('#manga-chapter .date-name').toArray().reverse();
            const titleList = $('#manga-chapter .chapter-name').toArray();
            for (const i in titleList.reverse()) {
                let id = $('a', titleList[i]).attr('href');
                let chapNum = parseFloat((_a = $('a', titleList[i]).text()) === null || _a === void 0 ? void 0 : _a.split(' ').pop());
                let name = $('a', titleList[i]).text().trim();
                let time = $(timeList[i]).text().trim().split('.');
                chapters.push(createChapter({
                    id,
                    chapNum: isNaN(chapNum) ? Number(i) + 1 : chapNum,
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${chapterId}`,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let arrayImages = $.html().match(/slides_page_path = (.*);/);
            let listImages = JSON.parse((_a = arrayImages === null || arrayImages === void 0 ? void 0 : arrayImages[1]) !== null && _a !== void 0 ? _a : "");
            let slides_page = [];
            if (listImages.length === 0) {
                arrayImages = $.html().match(/slides_page_url_path = (.*);/);
                listImages = JSON.parse((_b = arrayImages === null || arrayImages === void 0 ? void 0 : arrayImages[1]) !== null && _b !== void 0 ? _b : "");
                slides_page = listImages;
            }
            else {
                slides_page = listImages;
                // sort
                let length_chapter = slides_page.length - 1;
                for (let i = 0; i < length_chapter; i++)
                    for (let j = i + 1; j < slides_page.length; j++)
                        if (slides_page[j] < slides_page[i]) {
                            let temp = slides_page[j];
                            slides_page[j] = slides_page[i];
                            slides_page[i] = temp;
                        }
                // !sort
            }
            const pages = [];
            for (let obj of slides_page) {
                let link = encodeURI(obj);
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
        var _a, _b;
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
                title: "Truyện mới",
                view_more: true,
            });
            //Load empty sections
            // sectionCallback(featured);
            // sectionCallback(hot);
            sectionCallback(newUpdated);
            ///Get the section data
            //featured
            // let request = createRequestObject({
            //     url: DOMAIN,
            //     method: "GET",
            // });
            // let featuredItems: MangaTile[] = [];
            // let data = await this.requestManager.schedule(request, 1);
            // let $ = this.cheerio.load(data.data);
            // for (const element of $('.owl-carousel .slide-item').toArray()) {
            //     let title = $('.slide-info > h3 > a', element).text().trim();
            //     let img = $('a > img', element).attr("data-src") ?? $('a > img', element).attr("src");
            //     let id = $('.slide-info > h3 > a', element).attr('href') ?? title;
            //     let subtitle = $(".detail-slide > a", element).text().trim();
            //     featuredItems.push(createMangaTile(<MangaTile>{
            //         id: id ?? "",
            //         image: img ?? "",
            //         title: createIconText({ text: title }),
            //         subtitleText: createIconText({ text: subtitle }),
            //     }));
            // }
            // featured.items = featuredItems;
            // sectionCallback(featured);
            // Hot
            // request = createRequestObject({
            //     url: DOMAIN,
            //     method: "GET",
            // });
            // let popular: MangaTile[] = [];
            // data = await this.requestManager.schedule(request, 1);
            // $ = this.cheerio.load(data.data);
            // for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
            //     let title = $('.caption > h3 > a', element).text().trim();
            //     let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            //     let id = $('.caption > h3 > a', element).attr('href') ?? title;
            //     let subtitle = $("ul > li:first-child > a", element).text().trim();
            //     popular.push(createMangaTile(<MangaTile>{
            //         id: id ?? "",
            //         image: img ?? "",
            //         title: createIconText({ text: title }),
            //         subtitleText: createIconText({ text: subtitle }),
            //     }));
            // }
            // hot.items = popular;
            // sectionCallback(hot);
            //update
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            let newUpdatedItems = [];
            for (const element of $('#new-chapter .manga-update').toArray()) {
                let title = $('a', element).first().text().trim();
                let img = $('img', element).attr('src').replace('-80x90', '');
                let id = (_a = $('a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
                let subtitle = $('a', element).last().text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: (_b = encodeURI(img)) !== null && _b !== void 0 ? _b : "",
                    title: createIconText({ text: TruyentranhtuanParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            switch (homepageSectionId) {
                case "new_updated":
                    url = `http://truyentranhtuan.com/page/${page}/`;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(html);
            let manga = TruyentranhtuanParser_1.parseViewMore($);
            metadata = !TruyentranhtuanParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            let { availableTags } = require('./search');
            var key = query.title;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            let tiles = [];
            if (query.title) {
                var json = availableTags.filter(function (el) {
                    return el.label.toLowerCase().includes(key === null || key === void 0 ? void 0 : key.toLowerCase());
                });
                let manga = [];
                for (const i of json) {
                    manga.push(createMangaTile({
                        id: i.url,
                        image: '',
                        title: createIconText({ text: TruyentranhtuanParser_1.decodeHTMLEntity(i.label) }),
                    }));
                }
                tiles = manga;
            }
            else {
                const request = createRequestObject({
                    url: tags[0],
                    method: "GET",
                });
                let data = yield this.requestManager.schedule(request, 1);
                let $ = this.cheerio.load(data.data);
                tiles = TruyentranhtuanParser_1.parseSearch($);
            }
            metadata = undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen",
                    "label": "Tất cả"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/top/top-50",
                    "label": "Top 50"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/trang-thai/dang-tien-hanh",
                    "label": "Đang tiến hành"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/trang-thai/tam-dung",
                    "label": "Tạm ngừng"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/trang-thai/hoan-thanh/",
                    "label": "Hoàn thành"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/4-koma",
                    "label": "4-koma"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/action",
                    "label": "Action"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/adventure",
                    "label": "Adventure"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/anime",
                    "label": "Anime"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/comedy",
                    "label": "Comedy"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/comic",
                    "label": "Comic"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/drama",
                    "label": "Drama"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/ecchi-2",
                    "label": "ecchi"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/fantasy",
                    "label": "Fantasy"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/gender-bender",
                    "label": "Gender Bender"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/historical",
                    "label": "Historical"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/horror",
                    "label": "Horror"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/josei",
                    "label": "Josei"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/live-action",
                    "label": "Live Action"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/manhua",
                    "label": "Manhua"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/manhwa",
                    "label": "Manhwa"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/martial-arts",
                    "label": "Martial Arts"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/mature-2",
                    "label": "Mature"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/mecha",
                    "label": "Mecha"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/mystery",
                    "label": "Mystery"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/one-shot",
                    "label": "One Shot"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/psychological",
                    "label": "Psychological"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/romance",
                    "label": "Romance"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/school-life",
                    "label": "School Life"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/sci-fi",
                    "label": "Sci-fi"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/seinei",
                    "label": "Seinen"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/shoujo",
                    "label": "Shoujo"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/shoujo-ai-2",
                    "label": "Shoujo Ai"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/shounen",
                    "label": "Shounen"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/slice-of-life",
                    "label": "Slice of Life"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/smut",
                    "label": "Smut"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/sports",
                    "label": "Sports"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/supernatural",
                    "label": "Supernatural"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/tragedy",
                    "label": "Tragedy"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/truyen-scan",
                    "label": "Truyện scan"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/truyen-tranh-viet-nam",
                    "label": "Truyện tranh Việt Nam"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/webtoon",
                    "label": "Webtoon"
                },
                {
                    "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/yuri",
                    "label": "Yuri"
                }
            ];
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
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
exports.Truyentranhtuan = Truyentranhtuan;
