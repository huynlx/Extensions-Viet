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
exports.Truyengihot = exports.TruyengihotInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyengihotParser_1 = require("./TruyengihotParser");
const DOMAIN = 'https://truyengihot.net/';
const method = 'GET';
exports.TruyengihotInfo = {
    version: '1.5.0',
    name: 'Truyengihot',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyengihot',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyengihot extends paperback_extensions_common_1.Source {
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = mangaId;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = TruyengihotParser_1.decodeHTMLEntity($(".cover-artist a[href*=tac-gia]").text() || '');
            let statusFinal = $('.cover-artist img.top-tags').toArray();
            for (const x of statusFinal) {
                if (x.attribs['src'].includes('full.png')) {
                    statusFinal = 0;
                    break;
                }
                else {
                    statusFinal = 1;
                    break;
                }
            }
            for (const t of $('.cover-artist a[href*=the-loai]').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: TruyengihotParser_1.decodeHTMLEntity(genre), id }));
            }
            let desc = TruyengihotParser_1.decodeHTMLEntity($(".product-synopsis-content").html()).replace(/  +/g, '\n').replace(/<[^>]+>/g, '').replace('Xem thêm', '').trim();
            console.log(desc);
            let image = $(".cover-image img").first().attr("src");
            if (!image.includes('http'))
                image = 'https://truyengihot.net/' + image;
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [TruyengihotParser_1.decodeHTMLEntity($("h2.cover-title").text())],
                image: encodeURI(TruyengihotParser_1.decodeHTMLEntity(image)),
                status: statusFinal,
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method,
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            var el = $("#episode_list li a").toArray().reverse();
            const collectChapnum = [];
            const collectName = [];
            for (var i = 0; i <= el.length - 1; i++) {
                var e = el[i];
                let id = 'https://truyengihot.net/' + $(e).attr("href");
                let name = $('.no', e).text().trim();
                if (collectName.includes(name))
                    continue;
                collectName.push(name);
                let chapNum = parseFloat(name.split(' ')[1]);
                let chapNumfinal = isNaN(chapNum) ? i + 1 : (collectChapnum.includes(chapNum) ? (i + 1) : chapNum);
                collectChapnum.push(chapNumfinal);
                if ($('span', e).first().attr('class') === 'episode-item-lock')
                    name = '(LOCKED) ' + name;
                let time = $('.date', e).text().trim();
                chapters.push(createChapter({
                    id,
                    chapNum: chapNumfinal,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: this.convertTime(TruyengihotParser_1.decodeHTMLEntity(time))
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
            const base = 'https://truyengihot.net/';
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const pages = [];
            var el = $(".pageWrapper img").toArray();
            for (var i = 0; i < el.length; i++) {
                var e = el[i];
                let img = $(e).attr("data-echo");
                if (!img)
                    continue;
                if (!img.includes('http'))
                    img = base + img;
                pages.push(img);
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
            //Load empty sections
            sectionCallback(newUpdated);
            ///Get the section dat
            //New Updates
            let request = createRequestObject({
                url: 'https://truyengihot.net/danh-sach-truyen.html?page=1',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            var allItem = $('ul.cw-list li').toArray();
            for (var i in allItem) {
                var item = allItem[i];
                let title = $('.title a', item).text();
                let image = $('.thumb', item).attr('style').split(/['']/)[1];
                if (!image.includes('http'))
                    image = 'https://truyengihot.net/' + image;
                let id = 'https://truyengihot.net' + $('.title a', item).attr('href');
                let subtitle = $('.chapter-link', item).last().text();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(TruyengihotParser_1.decodeHTMLEntity(image)),
                    title: createIconText({ text: TruyengihotParser_1.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: TruyengihotParser_1.decodeHTMLEntity(subtitle) }),
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
            for (const element of $('#swiper-hot .swiper-slide a').toArray()) {
                let title = $('.info', element).text().trim();
                let image = $('img', element).attr("src");
                if (!image.includes('http'))
                    image = 'https://truyengihot.net/' + image;
                let id = 'https://truyengihot.net' + $(element).attr('href');
                featuredItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: encodeURI(TruyengihotParser_1.decodeHTMLEntity(image)),
                    title: createIconText({ text: TruyengihotParser_1.decodeHTMLEntity(title) }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
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
                    url = `https://truyengihot.net/danh-sach-truyen.html?page=${page}`;
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
            let manga = TruyengihotParser_1.parseViewMore($);
            metadata = !TruyengihotParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                genre: "",
                status: "",
                sort: "last_update",
                type: "",
                sortType: "DESC"
            };
            const genres = [];
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'genre':
                        genres.push(value.split(".")[1]);
                        break;
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break;
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break;
                    case 'type':
                        search.type = (value.split(".")[1]);
                        break;
                    case 'sortType':
                        search.sortType = (value.split(".")[1]);
                        break;
                }
            });
            search.genre = (genres !== null && genres !== void 0 ? genres : []).join(",");
            const request = createRequestObject({
                url: encodeURI(`${DOMAIN}danh-sach-truyen.html?listType=pagination&artist=&author=&group=&m_status=${search.status}&genre=${search.genre}&ungenre=&sort=${search.sort}&sort_type=${search.sortType}&manga_type=${search.type}&name=${(_d = query.title) !== null && _d !== void 0 ? _d : ""}&page=${page}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = TruyengihotParser_1.parseSearch($);
            metadata = !TruyengihotParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const tags3 = [];
            const tags4 = [];
            const tags5 = [];
            const request = createRequestObject({
                url: 'https://truyengihot.net/danh-sach-truyen.html',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //loai truyen
            for (const tag of $('#m_manga_type button').toArray()) {
                let label = $(tag).text().trim();
                let id = 'type.' + $(tag).attr('data-val');
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: (label) });
            }
            //the loai
            for (const tag of $('#m_genres button').toArray()) {
                let label = $(tag).text().trim();
                let id = 'genre.' + $(tag).attr('data-val');
                if (!id || !label)
                    continue;
                tags2.push({ id: id, label: (label) });
            }
            //trang thai
            for (const tag of $('#m_status button').toArray()) {
                let label = $(tag).text().trim();
                let id = 'status.' + $(tag).attr('data-val');
                if (!id || !label)
                    continue;
                tags3.push({ id: id, label: (label) });
            }
            //sap xep
            for (const tag of $('#m_sort button').toArray()) {
                let label = $(tag).text().trim();
                let id = 'sort.' + $(tag).attr('data-val');
                if (!id || !label)
                    continue;
                tags4.push({ id: id, label: (label) });
            }
            //loai sap xep
            for (const tag of $('#m_sort_type button').toArray()) {
                let label = $(tag).text().trim();
                let id = 'sortType.' + $(tag).attr('data-val');
                if (!id || !label)
                    continue;
                tags5.push({ id: id, label: (label) });
            }
            const tagSections = [
                createTagSection({ id: '1', label: 'Loại truyện', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Thể loại', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Trạng thái', tags: tags3.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Sắp xếp', tags: tags4.map(x => createTag(x)) }),
                createTagSection({ id: '5', label: 'Loại sắp xếp', tags: tags5.map(x => createTag(x)) }),
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
exports.Truyengihot = Truyengihot;
