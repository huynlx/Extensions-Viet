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
exports.MeDocTruyen = exports.MeDocTruyenInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MeDocTruyenParser_1 = require("./MeDocTruyenParser");
const method = 'GET';
exports.MeDocTruyenInfo = {
    version: '2.5.0',
    name: 'MeDocTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from MeDocTruyen',
    websiteBaseURL: `https://m.medoctruyentranh.net/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class MeDocTruyen extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
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
            let creator = '';
            var info = $(".detail_infos");
            creator = $(".other_infos font", info).first().text();
            for (const t of $('.other_infos:nth-child(3) > div:nth-child(2) > a', info).toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            let status = $('.other_infos:nth-child(3) > div:nth-child(1) > font', info).text().includes('Đang') ? 1 : 0; //completed, 1 = Ongoing
            let desc = $(".summary", info).text();
            const image = $(".detail_info img").first().attr("src");
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.title', info).text().trim()],
                image: image,
                status: status,
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
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt === null || dt === void 0 ? void 0 : dt.props.pageProps.initialState.detail.story_chapters;
            for (const t of novels) {
                for (const v of t) {
                    chapters.push(createChapter({
                        id: mangaId + '/' + v.chapter_index,
                        chapNum: v.chapter_index,
                        name: 'Chapter ' + v.chapter_index,
                        mangaId: mangaId,
                        langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                        time: new Date(v.time)
                    }));
                }
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
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            const pages = [];
            dt.props.pageProps.initialState.read.detail_item.elements.forEach((v) => {
                pages.push(v.content);
            });
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
                title: "Cập nhật mới",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Tác phẩm mới",
                view_more: true,
            });
            let suggest = createHomeSection({
                id: 'suggest',
                title: "Đề xuất truyện mới",
                view_more: true,
            });
            let chapter = createHomeSection({
                id: 'chapter',
                title: "Truyện nhiều chương",
                view_more: true,
            });
            let artbook = createHomeSection({
                id: 'artbook',
                title: "Chuyên mục Artbook",
                view_more: true,
            });
            // let selected: HomeSection = createHomeSection({
            //     id: 'selected',
            //     title: "Nội dung chọn lọc",
            //     view_more: true,
            // });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(view);
            sectionCallback(suggest);
            sectionCallback(chapter);
            sectionCallback(artbook);
            // sectionCallback(selected);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://www.medoctruyentranh.net/',
                method: "GET",
            });
            let updateItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt.props.pageProps.initialState.home.list[1].items.splice(0, 10);
            var el = $('.home-main-left > .area-con:nth-child(1) > .story-list-box > .story-item').toArray();
            for (var i = 0; i < el.length; i++) {
                var e = el[i];
                updateItems.push(createMangaTile({
                    id: $('a', e).first().attr('href'),
                    image: novels[i].img_url,
                    title: createIconText({ text: novels[i].title }),
                    subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
                }));
            }
            newUpdated.items = updateItems;
            sectionCallback(newUpdated);
            //Featured
            request = createRequestObject({
                url: 'https://www.medoctruyentranh.net/',
                method: "GET",
            });
            let featuredItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt.props.pageProps.initialState.home.list[0].items;
            novels.forEach((v) => {
                featuredItems.push(createMangaTile({
                    id: 'https://www.medoctruyentranh.net/truyen-tranh/' + MeDocTruyenParser_1.ChangeToSlug(v.title) + '-' + v.obj_id,
                    image: v.img_url,
                    title: createIconText({ text: v.title }),
                    subtitleText: createIconText({ text: 'Chapter ' + v.newest_chapters[0].chapter_index }),
                }));
            });
            featured.items = featuredItems;
            sectionCallback(featured);
            //Just Added
            request = createRequestObject({
                url: 'https://www.medoctruyentranh.net/',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt.props.pageProps.initialState.home.list[2].items.splice(0, 10);
            var el = $('.home-main-left > .area-con:nth-child(2) > .story-list-box > .story-item').toArray();
            for (var i = 0; i < el.length; i++) {
                var e = el[i];
                viewItems.push(createMangaTile({
                    id: $('a', e).first().attr('href'),
                    image: novels[i].img_url,
                    title: createIconText({ text: novels[i].title }),
                    subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
                }));
            }
            view.items = viewItems;
            sectionCallback(view);
            // Suggest
            request = createRequestObject({
                url: 'https://www.medoctruyentranh.net/',
                method: "GET",
            });
            let suggestItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt.props.pageProps.initialState.home.list[4].items.splice(0, 10);
            var el = $('.home-main-left > .area-con:nth-child(3) > .story-list-box > .story-item').toArray();
            for (var i = 0; i < el.length; i++) {
                var e = el[i];
                suggestItems.push(createMangaTile({
                    id: $('a', e).first().attr('href'),
                    image: novels[i].img_url,
                    title: createIconText({ text: novels[i].title }),
                    subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
                }));
            }
            suggest.items = suggestItems;
            sectionCallback(suggest);
            // chapter
            request = createRequestObject({
                url: 'https://www.medoctruyentranh.net/',
                method: "GET",
            });
            let chapterItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt.props.pageProps.initialState.home.list[8].items.splice(0, 10);
            var el = $('.home-main-left > .area-con:nth-child(4) > .story-list-box > .story-item').toArray();
            for (var i = 0; i < el.length; i++) {
                var e = el[i];
                chapterItems.push(createMangaTile({
                    id: $('a', e).first().attr('href'),
                    image: novels[i].img_url,
                    title: createIconText({ text: novels[i].title }),
                    subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
                }));
            }
            chapter.items = chapterItems;
            sectionCallback(chapter);
            // artbook
            request = createRequestObject({
                url: 'https://www.medoctruyentranh.net/',
                method: "GET",
            });
            let artbookItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            if (dt)
                dt = JSON.parse(dt[1]);
            var novels = dt.props.pageProps.initialState.home.list[11].items.splice(0, 10);
            var el = $('.home-main-left > .area-con:nth-child(5) > .story-list-box > .story-item').toArray();
            for (var i = 0; i < el.length; i++) {
                var e = el[i];
                artbookItems.push(createMangaTile({
                    id: $('a', e).first().attr('href'),
                    image: novels[i].img_url,
                    title: createIconText({ text: novels[i].title }),
                    subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
                }));
            }
            artbook.items = artbookItems;
            sectionCallback(artbook);
            // // selected
            // request = createRequestObject({
            //     url: 'https://www.medoctruyentranh.net/de-xuat/hay',
            //     method: "GET",
            // });
            // let selectedItems: MangaTile[] = [];
            // data = await this.requestManager.schedule(request, 1);
            // $ = this.cheerio.load(data.data);
            // var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            // if (dt) dt = JSON.parse(dt[1]);
            // var novels = dt.props.pageProps.initialState.more.moreList.list;
            // var covers: any = [];
            // novels.forEach((v: any) => {
            //     covers.push({
            //         image: v.coverimg,
            //         title: v.title,
            //         chapter: v.newest_chapter_name
            //     })
            // })
            // var el = $('.morelistCon a').toArray();
            // for (var i = 0; i < 5; i++) {
            //     var e = el[i];
            //     selectedItems.push(createMangaTile(<MangaTile>{
            //         id: $(e).attr("href"), // e.attribs['href']
            //         image: covers[i].image,
            //         title: createIconText({ text: covers[i].title }),
            //         subtitleText: createIconText({ text: covers[i].chapter }),
            //     }));
            // }
            // selected.items = selectedItems;
            // sectionCallback(selected);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let url = '';
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://www.medoctruyentranh.net/de-xuat/cap-nhat-moi/2`;
                    break;
                case "view":
                    url = `https://www.medoctruyentranh.net/de-xuat/tac-pham-moi/20`;
                    break;
                case "suggest":
                    url = `https://www.medoctruyentranh.net/de-xuat/de-xuat-truyen-moi/37`;
                    break;
                case "chapter":
                    url = `https://www.medoctruyentranh.net/de-xuat/truyen-nhieu-chuong/35`;
                    break;
                case "artbook":
                    url = `https://www.medoctruyentranh.net/de-xuat/chuyen-muc-artbook/36`;
                    break;
                // case "selected":
                //     url = `https://www.medoctruyentranh.net/de-xuat/hay`;
                //     break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let manga = MeDocTruyenParser_1.parseViewMore($);
            metadata = !MeDocTruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                cate: 'toan-bo',
                status: "",
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break;
                }
            });
            const request = createRequestObject({
                url: encodeURI(query.title ? `https://www.medoctruyentranh.net/search/${query.title}` : `https://www.medoctruyentranh.net/tim-truyen/${search.cate}/${page}?${search.status}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = MeDocTruyenParser_1.parseSearch($, query);
            metadata = !MeDocTruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [];
            const tags5 = [];
            const url = `https://www.medoctruyentranh.net/tim-truyen/toan-bo`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.searchCon > .search:nth-child(1) > .right > a').toArray()) {
                const label = $(tag).text().trim();
                const id = 'cate.' + $(tag).attr('href').split('/').pop();
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            //trang thai
            for (const tag of $('.searchCon > .search:nth-child(2) > .right > a').toArray()) {
                var label = $(tag).text().trim();
                const id = 'status.' + $(tag).attr('href').split('?').pop();
                if (!id || !label)
                    continue;
                tags5.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://www.medoctruyentranh.net/'
        };
    }
}
exports.MeDocTruyen = MeDocTruyen;
