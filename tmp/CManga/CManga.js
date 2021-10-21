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
exports.CManga = exports.CMangaInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const CMangaParser_1 = require("./CMangaParser");
const DOMAIN = 'https://cmangatop.com/';
const method = 'GET';
exports.CMangaInfo = {
    version: '2.0.0',
    name: 'CManga',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from CManga',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class CManga extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 2,
            requestTimeout: 15000
        });
    }
    getMangaShareUrl(mangaId) { return DOMAIN + mangaId.split("::")[0]; }
    ;
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: DOMAIN + mangaId.split("::")[0],
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const book_id = $.html().match(/book_id.+"(.+)"/)[1];
            // const request2 = createRequestObject({
            //     url: "https://cmangatop.com/api/book_detail?opt1=" + book_id,
            //     method: "GET",
            // });
            // const data2 = await this.requestManager.schedule(request2, 1);
            // var json = JSON.parse(decrypt_data(JSON.parse(data2.data)))[0];
            // let tags: Tag[] = [];
            let status = $(".status").first().text().indexOf("Đang") != -1 ? 1 : 0;
            let desc = $("#book_detail").first().text() === '' ? $("#book_more").first().text() : $("#book_detail").first().text();
            // for (const t of json.tags.split(",")) {
            //     if (t === '') continue;
            //     const genre = t;
            //     const id = genre;
            //     tags.push(createTag({ label: titleCase(genre), id }));
            // }
            const image = $(".book_avatar img").first().attr("src");
            const creator = $(".profile a").text() || 'Unknown';
            return createManga({
                id: mangaId + "::" + book_id,
                author: creator,
                artist: creator,
                desc: CMangaParser_1.decodeHTMLEntity(desc),
                titles: [CMangaParser_1.titleCase($("h1").text())],
                image: DOMAIN + image,
                status,
                hentai: false,
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request2 = createRequestObject({
                url: "https://cmangatop.com/api/book_chapter?opt1=" + mangaId.split("::")[2],
                method: "GET",
            });
            const data2 = yield this.requestManager.schedule(request2, 1);
            var json = JSON.parse(CMangaParser_1.decrypt_data(JSON.parse(data2.data)));
            const chapters = [];
            for (const obj of json) {
                const time = obj.last_update.split(' ');
                const d = time[0].split('-');
                const t = time[1].split(':');
                const d2 = d[1] + '/' + d[2] + '/' + d[0];
                const t2 = t[0] + ":" + t[1];
                chapters.push(createChapter({
                    id: DOMAIN + mangaId.split("::")[1] + '/' + CMangaParser_1.change_alias(obj.chapter_name) + '/' + obj.id_chapter,
                    chapNum: parseFloat(obj.chapter_num),
                    name: CMangaParser_1.titleCase(obj.chapter_name) === ('Chapter ' + obj.chapter_num) ? '' : CMangaParser_1.titleCase(obj.chapter_name),
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(d2 + " " + t2)
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}${chapterId}`;
            const chapID = url.split('/').pop();
            const request = createRequestObject({
                url: 'https://cmangatop.com/api/chapter_content?opt1=' + chapID,
                method
            });
            const data = yield this.requestManager.schedule(request, 1);
            var chapter_content = JSON.parse(JSON.parse(CMangaParser_1.decrypt_data(JSON.parse(data.data)))[0].content);
            var pages = [];
            for (const img of chapter_content) {
                pages.push(img.replace('.net', '.com'));
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
            let hot = createHomeSection({
                id: 'hot',
                title: "Top ngày",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện mới cập nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "VIP Truyện Siêu Hay",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            ///Get the section data
            // Hot
            let request = createRequestObject({
                url: 'https://cmangatop.com/api/top?data=book_top',
                method: "GET",
            });
            let popular = [];
            let data = yield this.requestManager.schedule(request, 1);
            let json = JSON.parse(data.data);
            for (var i of Object.keys(json.day)) {
                var item = json.day[i];
                if (!item.name)
                    continue;
                popular.push(createMangaTile({
                    id: item.url + '-' + item.id + "::" + item.url,
                    image: 'https://cmangatop.com/assets/tmp/book/avatar/' + item.avatar + '.jpg',
                    title: createIconText({
                        text: CMangaParser_1.titleCase(item.name),
                    }),
                    subtitleText: createIconText({
                        text: 'Chap ' + item.chapter,
                    }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            //New Updates
            request = createRequestObject({
                url: "https://cmangatop.com/api/list_item",
                method: "GET",
                param: '?page=1&limit=20&sort=new&type=all&tag=&child=off&status=all&num_chapter=0'
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            json = JSON.parse(CMangaParser_1.decrypt_data(JSON.parse(data.data)));
            for (var i of Object.keys(json)) {
                var item = json[i];
                if (!item.name)
                    continue;
                newUpdatedItems.push(createMangaTile({
                    id: item.url + '-' + item.id_book + "::" + item.url,
                    image: 'https://cmangatop.com/assets/tmp/book/avatar/' + item.avatar + '.jpg',
                    title: createIconText({
                        text: CMangaParser_1.titleCase(item.name),
                    }),
                    subtitleText: createIconText({
                        text: 'Chap ' + item.last_chapter,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //New Added
            request = createRequestObject({
                url: "https://cmangatop.com/api/list_item",
                param: "?page=1&limit=20&sort=new&type=all&tag=Truy%E1%BB%87n%20si%C3%AAu%20hay&child=off&status=all&num_chapter=0",
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            json = JSON.parse(CMangaParser_1.decrypt_data(JSON.parse(data.data)));
            console.log(json);
            for (var i of Object.keys(json)) {
                var item = json[i];
                if (!item.name)
                    continue;
                newAddItems.push(createMangaTile({
                    id: item.url + '-' + item.id_book + "::" + item.url,
                    image: 'https://cmangatop.com/assets/tmp/book/avatar/' + item.avatar + '.jpg',
                    title: createIconText({
                        text: CMangaParser_1.titleCase(item.name),
                    }),
                    subtitleText: createIconText({
                        text: 'Chap ' + item.last_chapter,
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
            let method = "GET";
            switch (homepageSectionId) {
                case "new_updated":
                    url = "https://cmangatop.com/api/list_item";
                    param = `?page=${page}&limit=40&sort=new&type=all&tag=&child=off&status=all&num_chapter=0`;
                    break;
                case "new_added":
                    url = "https://cmangatop.com/api/list_item";
                    param = `?page=${page}&limit=40&sort=new&type=all&tag=Truy%E1%BB%87n%20si%C3%AAu%20hay&child=off&status=all&num_chapter=0`;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method,
                param
            });
            let data = yield this.requestManager.schedule(request, 1);
            var json = JSON.parse(CMangaParser_1.decrypt_data(JSON.parse(data.data))); // object not array
            const manga = CMangaParser_1.parseViewMore(json);
            var allPage = (json['total'] / 40);
            metadata = (page < allPage) ? { page: page + 1 } : undefined;
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
            const search = {
                status: "all",
                num_chapter: "0",
                sort: "new",
                tag: "",
                top: ""
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break;
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break;
                    case 'num':
                        search.num_chapter = (value.split(".")[1]);
                        break;
                    case 'tag':
                        search.tag = (value.split(".")[1]);
                        break;
                    case 'top':
                        search.top = (value.split(".")[1]);
                        break;
                }
            });
            const request = createRequestObject({
                url: query.title ? encodeURI('https://cmangatop.com/api/search?opt1=' + (query.title))
                    : (search.top !== '' ? "https://cmangatop.com/api/top?data=book_top" : encodeURI(`https://cmangatop.com/api/list_item?page=${page}&limit=40&sort=${search.sort}&type=all&tag=${search.tag}&child=off&status=${search.status}&num_chapter=${search.num_chapter}`)),
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            var json = (query.title || search.top !== "") ? JSON.parse(data.data) : JSON.parse(CMangaParser_1.decrypt_data(JSON.parse(data.data))); // object not array
            const tiles = CMangaParser_1.parseSearch(json, search);
            var allPage = (json['total'] / 40);
            metadata = (page < allPage) ? { page: page + 1 } : undefined;
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
            const arrayTags2 = [
                {
                    label: 'Ngày đăng',
                    id: 'sort.new'
                },
                {
                    label: 'Lượt xem',
                    id: 'sort.view'
                },
                {
                    label: 'Lượt theo dõi',
                    id: 'sort.follow'
                }
            ];
            const arrayTags3 = [
                {
                    label: 'Tất cả',
                    id: 'status.all'
                },
                {
                    label: 'Hoàn thành',
                    id: 'status.completed'
                }
            ];
            const arrayTags4 = [
                {
                    label: '>= 100',
                    id: 'num.100'
                },
                {
                    label: '>= 200',
                    id: 'num.200'
                },
                {
                    label: '>= 300',
                    id: 'num.300'
                },
                {
                    label: '>= 400',
                    id: 'num.400'
                },
                {
                    label: '>= 500',
                    id: 'num.500'
                }
            ];
            const arrayTags5 = [
                {
                    label: 'Top Ngày',
                    id: 'top.day'
                },
                {
                    label: 'Top Tuần',
                    id: 'top.week'
                },
                {
                    label: 'Top Tổng',
                    id: 'top.month'
                }
            ];
            //the loai
            for (const tag of $('.book_tags_content a').toArray()) {
                const label = $(tag).text().trim();
                const id = 'tag.' + label;
                arrayTags.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Sắp xếp theo', tags: arrayTags2.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Tình trạng', tags: arrayTags3.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Num chapter', tags: arrayTags4.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Rank', tags: arrayTags5.map(x => createTag(x)) }),
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
exports.CManga = CManga;
