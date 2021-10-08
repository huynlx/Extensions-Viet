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
exports.SayTruyen = exports.SayTruyenInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const SayTruyenParser_1 = require("./SayTruyenParser");
const DOMAIN = 'https://saytruyen.net/';
const method = 'GET';
exports.SayTruyenInfo = {
    version: '2.0.0',
    name: 'SayTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from SayTruyen',
    websiteBaseURL: `https://saytruyen.net/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class SayTruyen extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
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
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let status = 1; //completed, 1 = Ongoing
            let desc = $('.detail-content > p').text();
            for (const t of $('.list01.li03 > a.genner-block').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            creator = $('.list-info > li:nth-child(1)').text().split(":")[1].trim();
            status = $('.list-info > li:nth-child(2) > b').text().toLowerCase().includes("đang") ? 1 : 0;
            const image = $('.wrap-content-image > img').attr('src');
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.wrap-content-info > h1').text().trim()],
                image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? image : ((image === null || image === void 0 ? void 0 : image.includes('//')) ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
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
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $("#list-chapter > li.chap-item").toArray().reverse()) {
                var chapNum = parseFloat($('a', obj).text().trim().split(' ')[1]);
                i++;
                chapters.push(createChapter({
                    id: $('a', obj).first().attr('href'),
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: $('span', obj).text().trim(),
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
                url: `${DOMAIN}${chapterId}`,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            for (let obj of $('#lst_content > img').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                let link = obj.attribs['src'].includes('http') ?
                    (obj.attribs['src']).trim() : (DOMAIN + obj.attribs['src']).trim();
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
            let hot = createHomeSection({
                id: 'hot',
                title: "Top Trong Ngày",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới Cập Nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện Mới",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            //Hot
            let url = '';
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let hotItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('li', '#main-content > .wrap-content-part:nth-child(4) > .body-content-part > ul').toArray()) {
                let title = $(`.info-bottom > a`, obj).text().trim();
                let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
                const image = $(`a > img`, obj).attr('src');
                let id = (_a = $(`.info-bottom > a`, obj).attr("href")) !== null && _a !== void 0 ? _a : title;
                // if (!id || !subtitle) continue;
                hotItems.push(createMangaTile({
                    id: id,
                    image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? image : ((image === null || image === void 0 ? void 0 : image.includes('//')) ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
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
                url: DOMAIN,
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '#main-content > .wrap-content-part:nth-child(5) > .body-content-part > ul').toArray().splice(0, 15)) {
                let title = $(`.info-bottom > a`, obj).text().trim();
                let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
                const image = $(`a > img`, obj).attr('data-src');
                let id = (_b = $(`.info-bottom > a`, obj).attr("href")) !== null && _b !== void 0 ? _b : title;
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? image : ((image === null || image === void 0 ? void 0 : image.includes('//')) ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
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
            //New Added
            url = DOMAIN;
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let obj of $('li', '#main-content > .wrap-content-part:nth-child(7) > .body-content-part > ul').toArray()) {
                let title = $(`.info-bottom > a`, obj).text().trim();
                let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
                const image = $(`a > img`, obj).attr('data-src');
                let id = (_c = $(`.info-bottom > a`, obj).attr("href")) !== null && _c !== void 0 ? _c : title;
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: (image === null || image === void 0 ? void 0 : image.includes('http')) ? image : ((image === null || image === void 0 ? void 0 : image.includes('//')) ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: subtitle,
                    }),
                }));
            }
            newAdded.items = newAddItems;
            sectionCallback(newAdded);
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
                    url = `${DOMAIN}danh-sach-truyen.html?status=0&sort=views&page=${page}`;
                    break;
                case "new_updated":
                    url = `${DOMAIN}danh-sach-truyen.html?page=${page}`;
                    break;
                case "new_added":
                    url = `${DOMAIN}danh-sach-truyen.html?status=0&sort=id&page=${page}`;
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
            const manga = SayTruyenParser_1.parseViewMore($);
            metadata = !SayTruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                genres: '',
                status: "0",
                sort: "last_update",
                name: (_d = query.title) !== null && _d !== void 0 ? _d : ''
            };
            tags.map((value) => {
                if (value.indexOf('.') === -1) {
                    search.genres = value;
                }
                else {
                    switch (value.split(".")[0]) {
                        case 'sort':
                            search.sort = (value.split(".")[1]);
                            break;
                        case 'status':
                            search.status = (value.split(".")[1]);
                            break;
                    }
                }
            });
            const request = createRequestObject({
                url: (tags[0] === 'all' ? (DOMAIN + 'danh-sach-truyen.html?') : encodeURI(`${DOMAIN}danh-sach-truyen.html?status=${search.status}&name=${search.name}&genre=${search.genres}&sort=${search.sort}`)),
                method: "GET",
                param: encodeURI(`&page=${page}`)
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = SayTruyenParser_1.parseSearch($);
            metadata = !SayTruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                    "id": "all",
                    "label": "Tất cả"
                },
                {
                    "id": "18",
                    "label": "18+"
                },
                {
                    "id": "action",
                    "label": "Action"
                },
                {
                    "id": "adult",
                    "label": "Adult"
                },
                {
                    "id": "adventure",
                    "label": "Adventure"
                },
                {
                    "id": "anime",
                    "label": "Anime"
                },
                {
                    "id": "chuyển sinh",
                    "label": "Chuyển Sinh"
                },
                {
                    "id": "comedy",
                    "label": "Comedy"
                },
                {
                    "id": "comic",
                    "label": "Comic"
                },
                {
                    "id": "cooking",
                    "label": "Cooking"
                },
                {
                    "id": "cổ đại",
                    "label": "Cổ Đại"
                },
                {
                    "id": "doujinshi",
                    "label": "Doujinshi"
                },
                {
                    "id": "drama",
                    "label": "Drama"
                },
                {
                    "id": "đam mỹ",
                    "label": "Đam Mỹ"
                },
                {
                    "id": "ecchi",
                    "label": "Ecchi"
                },
                {
                    "id": "fantasy",
                    "label": "Fantasy"
                },
                {
                    "id": "gender bender",
                    "label": "Gender Bender"
                },
                {
                    "id": "harem",
                    "label": "Harem"
                },
                {
                    "id": "historical",
                    "label": "Historical"
                },
                {
                    "id": "horror",
                    "label": "Horror"
                },
                {
                    "id": "isekai",
                    "label": "Isekai"
                },
                {
                    "id": "josei",
                    "label": "Josei"
                },
                {
                    "id": "live action",
                    "label": "Live action"
                },
                {
                    "id": "manga",
                    "label": "Manga"
                },
                {
                    "id": "manhua",
                    "label": "Manhua"
                },
                {
                    "id": "manhwa",
                    "label": "Manhwa"
                },
                {
                    "id": "martial arts",
                    "label": "Martial Arts"
                },
                {
                    "id": "mature",
                    "label": "Mature"
                },
                {
                    "id": "mecha",
                    "label": "Mecha"
                },
                {
                    "id": "mystery",
                    "label": "Mystery"
                },
                {
                    "id": "ngôn tình",
                    "label": "Ngôn Tình"
                },
                {
                    "id": "one shot",
                    "label": "One shot"
                },
                {
                    "id": "psychological",
                    "label": "Psychological"
                },
                {
                    "id": "romance",
                    "label": "Romance"
                },
                {
                    "id": "school life",
                    "label": "School Life"
                },
                {
                    "id": "sci-fi",
                    "label": "Sci-fi"
                },
                {
                    "id": "seinen",
                    "label": "Seinen"
                },
                {
                    "id": "shoujo",
                    "label": "Shoujo"
                },
                {
                    "id": "shoujo ai",
                    "label": "Shoujo Ai"
                },
                {
                    "id": "shounen",
                    "label": "Shounen"
                },
                {
                    "id": "shounen ai",
                    "label": "Shounen Ai"
                },
                {
                    "id": "slice of life",
                    "label": "Slice of Life"
                },
                {
                    "id": "smut",
                    "label": "Smut"
                },
                {
                    "id": "soft yaoi",
                    "label": "Soft Yaoi"
                },
                {
                    "id": "soft yuri",
                    "label": "Soft Yuri"
                },
                {
                    "id": "sports",
                    "label": "Sports"
                },
                {
                    "id": "supernatural",
                    "label": "Supernatural"
                },
                {
                    "id": "tragedy",
                    "label": "Tragedy"
                },
                {
                    "id": "trinh thám",
                    "label": "Trinh Thám"
                },
                {
                    "id": "truyện màu",
                    "label": "Truyện Màu"
                },
                {
                    "id": "webtoon",
                    "label": "Webtoon"
                },
                {
                    "id": "xuyên không",
                    "label": "Xuyên Không"
                }
            ];
            const tags1 = [
                {
                    "id": "status.0",
                    "label": "Tất Cả"
                },
                {
                    "id": "status.2",
                    "label": "Đang Tiến Hành"
                },
                {
                    "id": "status.1",
                    "label": "Đã Hoàn Thành"
                }
            ];
            const tags2 = [
                {
                    "id": "sort.name",
                    "label": "Tên Truyện"
                },
                {
                    "id": "sort.views",
                    "label": "Lượt Xem"
                },
                {
                    "id": "sort.last_update",
                    "label": "Ngày Cập Nhật"
                },
                {
                    "id": "sort.id",
                    "label": "Truyện Mới"
                }
            ];
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Trạng Thái', tags: tags1.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Xếp Theo', tags: tags2.map(x => createTag(x)) }),
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
exports.SayTruyen = SayTruyen;
