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
exports.Baotangtruyentranh = exports.BaotangtruyentranhInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const BaotangtruyentranhParser_1 = require("./BaotangtruyentranhParser");
const DOMAIN = 'https://baotangtruyentranh.com/';
const method = 'GET';
exports.BaotangtruyentranhInfo = {
    version: '1.0.0',
    name: 'Baotangtruyentranh',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Baotangtruyentranh',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Baotangtruyentranh extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('giây')) {
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
            time = new Date(Date.now() - trimmed * 86400000 * 7 * 4 * 12);
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
                let split = timeAgo.split('/'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time;
    }
    getMangaShareUrl(mangaId) { return (mangaId); }
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
            let creator = BaotangtruyentranhParser_1.decodeHTMLEntity($('.author p').last().text().trim());
            let statusFinal = $('.status p').last().text().trim().includes('Đang') ? 1 : 0;
            for (const t of $('a', '.kind').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: BaotangtruyentranhParser_1.decodeHTMLEntity(genre), id }));
            }
            let desc = $("#summary").text();
            let image = (_b = $('.col-image img').attr("data-src")) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [BaotangtruyentranhParser_1.decodeHTMLEntity($('.title-detail').text().trim())],
                image: encodeURI(BaotangtruyentranhParser_1.decodeHTMLEntity(image)),
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
            for (const obj of $('#nt_listchapter .row:not(.heading)').toArray()) {
                let id = $('a', obj).first().attr('href');
                let chapNum = parseFloat((_a = $('a', obj).first().text()) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                let name = ($('a', obj).first().text().trim() === ('Chapter ' + chapNum.toString())) ? '' : $('a', obj).first().text().trim();
                if ($('.coin-unlock', obj).attr('title')) {
                    name = 'LOCKED (' + $('.coin-unlock', obj).attr('title') + ')';
                }
                let time = $('.col-xs-4', obj).text().trim();
                chapters.push(createChapter({
                    id,
                    chapNum: chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: this.convertTime(BaotangtruyentranhParser_1.decodeHTMLEntity(time))
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
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const pages = [];
            for (let obj of $('.reading-detail img').toArray()) {
                let image = $(obj).attr('data-src');
                pages.push(encodeURI(image));
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
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "TRUYỆN MỚI CẬP NHẬT",
                view_more: true,
            });
            let trans = createHomeSection({
                id: 'trans',
                title: "TRUYỆN DỊCH",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(trans);
            ///Get the section dat
            //New Updates
            let request = createRequestObject({
                url: 'https://baotangtruyentranh.com/?page=1&typegroup=0',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('.row .item').toArray()) {
                let title = $('h3 > a', element).text().trim();
                let image = $('.image img', element).attr("data-src");
                let id = $('h3 > a', element).attr('href');
                let subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(BaotangtruyentranhParser_1.decodeHTMLEntity(image)),
                    title: createIconText({ text: BaotangtruyentranhParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: BaotangtruyentranhParser_1.decodeHTMLEntity(subtitle) }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //featured
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let featuredItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.items-slide .item').toArray()) {
                let title = $('.slide-caption h3', element).text().trim();
                let image = $('a img', element).attr("data-src");
                let id = $('a', element).attr('href');
                let subtitle = $(".slide-caption > a", element).first().text().trim() + ' | ' + $(".time", element).first().text().trim();
                featuredItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(BaotangtruyentranhParser_1.decodeHTMLEntity(image)),
                    title: createIconText({ text: BaotangtruyentranhParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: BaotangtruyentranhParser_1.decodeHTMLEntity(subtitle) }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //trans
            request = createRequestObject({
                url: 'https://baotangtruyentranh.com/?page=1&typegroup=1',
                method: "GET",
            });
            let transItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.row .item').toArray()) {
                let title = $('h3 > a', element).text().trim();
                let image = $('.image img', element).attr("data-src");
                let id = $('h3 > a', element).attr('href');
                let subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
                transItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(BaotangtruyentranhParser_1.decodeHTMLEntity(image)),
                    title: createIconText({ text: BaotangtruyentranhParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: BaotangtruyentranhParser_1.decodeHTMLEntity(subtitle) }),
                }));
            }
            trans.items = transItems;
            sectionCallback(trans);
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
                    url = `https://baotangtruyentranh.com/?page=${page}&typegroup=0`;
                    select = 1;
                    break;
                case "trans":
                    url = `https://baotangtruyentranh.com/?page=${page}&typegroup=1`;
                    select = 1;
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
            let manga = BaotangtruyentranhParser_1.parseViewMore($);
            metadata = !BaotangtruyentranhParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                cate: "",
                status: "-1",
                sort: "0",
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
                url: query.title ? encodeURI(`https://baotangtruyentranh.com/tim-truyen?keyword=${query.title}&page=${page}`)
                    : encodeURI(`https://baotangtruyentranh.com/tim-truyen/${search.cate}?status=${search.status}&sort=${search.sort}&page=${page}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = BaotangtruyentranhParser_1.parseSearch($);
            metadata = !BaotangtruyentranhParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const tags2 = [
                {
                    id: 'status.-1',
                    label: 'Tất cả'
                },
                {
                    id: 'status.2',
                    label: 'Hoàn thành'
                },
                {
                    id: 'status.1',
                    label: 'Đang tiến hành'
                }
            ];
            const tags3 = [
                {
                    id: 'sort.13',
                    label: 'Top ngày'
                },
                {
                    id: 'sort.12',
                    label: 'Top tuần'
                },
                {
                    id: 'sort.11',
                    label: 'Top tháng'
                },
                {
                    id: 'sort.10',
                    label: 'Top all'
                },
                {
                    id: 'sort.20',
                    label: 'Theo dõi'
                },
                {
                    id: 'sort.25',
                    label: 'Bình luận'
                },
                {
                    id: 'sort.15',
                    label: 'Truyện mới'
                },
                {
                    id: 'sort.30',
                    label: 'Số chapter'
                },
                {
                    id: 'sort.0',
                    label: 'Ngày cập nhật'
                }
            ];
            const url = DOMAIN;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.megamenu .nav a').toArray()) {
                let label = $(tag).text().trim();
                let id = 'cate.' + $(tag).attr('href').split('/').pop();
                if (label === 'Tất cả')
                    id = 'cate.';
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: BaotangtruyentranhParser_1.decodeHTMLEntity(label) });
            }
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Tình trạng', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags3.map(x => createTag(x)) }),
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
exports.Baotangtruyentranh = Baotangtruyentranh;
