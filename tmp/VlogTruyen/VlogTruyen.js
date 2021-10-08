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
exports.VlogTruyen = exports.VlogTruyenInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const VlogTruyenParser_1 = require("./VlogTruyenParser");
const method = 'GET';
exports.VlogTruyenInfo = {
    version: '2.6.0',
    name: 'VlogTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from VlogTruyen',
    websiteBaseURL: `https://vlogtruyen.net/`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class VlogTruyen extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
    }
    getMangaShareUrl(mangaId) { return `${mangaId}`; }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = $('.top-detail-manga-content > .drawer:nth-child(5) a').text().trim();
            let status = $('.manga-status > p').text().trim(); //completed, 1 = Ongoing
            let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
            let desc = $(".desc-commic-detail").text().trim();
            for (const t of $('.categories-list-detail-commic > li > a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            const image = (_b = $('.image-commic-detail img').attr('data-src')) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.title-commic-detail').text().trim()],
                image: image,
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
                url: `${mangaId}`,
                method,
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            var i = 0;
            for (const obj of $('.ul-list-chaper-detail-commic > li').toArray().reverse()) {
                i++;
                let id = $('a', obj).first().attr('href');
                let chapNum = Number((_a = $('a', obj).first().attr('title')) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                let name = $('a', obj).first().attr('title');
                let time = $('span:nth-child(4)', obj).text().trim().split('-');
                chapters.push(createChapter({
                    id,
                    chapNum: isNaN(chapNum) ? i : chapNum,
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${chapterId}`,
                method
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const pages = [];
            for (let obj of $('#aniimated-thumbnial > img').toArray()) {
                let link = (_a = $(obj).attr('src')) !== null && _a !== void 0 ? _a : "";
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
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Mới cập nhật",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Đang hot",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "Xem nhiều",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(newUpdated);
            sectionCallback(hot);
            sectionCallback(view);
            ///Get the section data
            //New Updates
            let request = createRequestObject({
                url: 'https://vlogtruyen.net/the-loai/moi-cap-nhap',
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray().splice(0, 20)) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_a = $('.image-commic-tab > img', element).attr('data-src')) !== null && _a !== void 0 ? _a : "";
                let id = $('a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //hot
            request = createRequestObject({
                url: 'https://vlogtruyen.net/the-loai/dang-hot',
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray().splice(0, 20)) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_b = $('.image-commic-tab > img', element).attr('data-src')) !== null && _b !== void 0 ? _b : "";
                let id = $('a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                hotItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //view
            request = createRequestObject({
                url: 'https://vlogtruyen.net/de-nghi/pho-bien/xem-nhieu',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray().splice(0, 20)) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = (_c = $('.image-commic-tab > img', element).attr('data-src')) !== null && _c !== void 0 ? _c : "";
                let id = $('a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                viewItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
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
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://vlogtruyen.net/the-loai/moi-cap-nhap?page=${page}`;
                    select = 1;
                    break;
                case "hot":
                    url = `https://vlogtruyen.net/the-loai/dang-hot?page=${page}`;
                    select = 2;
                    break;
                case "view":
                    url = `https://vlogtruyen.net/de-nghi/pho-bien/xem-nhieu?page=${page}`;
                    select = 3;
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
            let manga = VlogTruyenParser_1.parseViewMore($);
            metadata = !VlogTruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                cate: '',
                translator: "",
                writer: "",
                status: "Trạng+thái",
                sort: "moi-nhat"
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'translator':
                        search.translator = (value.split(".")[1]);
                        break;
                    case 'writer':
                        search.writer = (value.split(".")[1]);
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
                url: query.title ? encodeURI(`https://vlogtruyen.net/tim-kiem?q=${query.title}&page=${page}`) :
                    (tags[0].includes('http') ? (tags[0] + `?page=${page}`) :
                        encodeURI(`https://vlogtruyen.net/the-loai/huynh?cate=${search.cate}&translator=${search.translator}&writer=${search.writer}&status=${search.status}&sort=${search.sort}&page=${page}`)),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = VlogTruyenParser_1.parseSearch($, query, tags);
            metadata = !VlogTruyenParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                    id: 'https://vlogtruyen.net/bang-xep-hang/top-tuan',
                    label: 'Top tuần'
                },
                {
                    id: 'https://vlogtruyen.net/bang-xep-hang/top-thang',
                    label: 'Top tháng'
                },
                {
                    id: 'https://vlogtruyen.net/bang-xep-hang/top-nam',
                    label: 'Top năm'
                }
            ];
            const tags3 = [];
            const tags4 = [];
            const tags5 = [];
            const tags6 = [];
            const url = `https://vlogtruyen.net/the-loai/dang-hot`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('select[name="cate"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'cate.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            //nhom dich
            for (const tag of $('select[name="translator"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'translator.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags3.push({ id: id, label: label });
            }
            //tac gia
            for (const tag of $('select[name="writer"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'writer.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags4.push({ id: id, label: label });
            }
            //trang thai
            for (const tag of $('select[name="status"] > option:not(:first-child)').toArray()) {
                const label = $(tag).text().trim();
                const id = 'status.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags5.push({ id: id, label: label });
            }
            //sap xep
            for (const tag of $('select[name="sort"] > option').toArray()) {
                const label = $(tag).text().trim();
                const id = 'sort.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags6.push({ id: id, label: label });
            }
            const tagSections = [createTagSection({ id: '0', label: 'Bảng xếp hạng', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '2', label: 'Nhóm dịch', tags: tags3.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Tác giả', tags: tags4.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
                createTagSection({ id: '5', label: 'Sắp xếp', tags: tags6.map(x => createTag(x)) }),
            ];
            return tagSections;
        });
    }
    globalRequestHeaders() {
        return {
            referer: 'https://vlogtruyen.net/'
        };
    }
}
exports.VlogTruyen = VlogTruyen;
