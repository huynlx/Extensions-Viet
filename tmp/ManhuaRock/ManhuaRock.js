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
exports.ManhuaRock = exports.ManhuaRockInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const ManhuaRockParser_1 = require("./ManhuaRockParser");
const DOMAIN = 'https://manhuarock.net/';
const method = 'GET';
exports.ManhuaRockInfo = {
    version: '1.5.0',
    name: 'ManhuaRock',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from ManhuaRock',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class ManhuaRock extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000
        });
        // override getCloudflareBypassRequest(): Request {
        //     return createRequestObject({ //https://lxhentai.com/
        //         url: 'https://manhuarock.net/',
        //         method: 'GET',
        //     }) //dit buoi lam lxhentai nua dkm, ti fix thanh medoctruyen
        // }
    }
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
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
        else if (timeAgo.includes('năm')) {
            time = new Date(Date.now() - trimmed * 31556952000);
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
    getMangaShareUrl(mangaId) { return (DOMAIN + mangaId); }
    ;
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = DOMAIN + mangaId;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = '';
            let statusFinal = 1;
            for (const test of $('li', '.manga-info').toArray()) {
                switch ($('b', test).text().trim()) {
                    case "Tác giả":
                        creator = $('a', test).text().trim();
                        break;
                    case "Thể loại":
                        for (const t of $('a', test).toArray()) {
                            const genre = $(t).text().trim();
                            const id = (_a = $(t).attr('href')) !== null && _a !== void 0 ? _a : genre;
                            tags.push(createTag({ label: genre, id }));
                        }
                        break;
                    case "Tình trạng":
                        let status = $('a', test).text().trim(); //completed, 1 = Ongoing
                        statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
                        break;
                }
            }
            let desc = $(".summary-content").text();
            const image = (_b = $('.info-cover img').attr("src")) !== null && _b !== void 0 ? _b : "";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: desc,
                titles: [$('.manga-info h3').text().trim()],
                image: image.includes('http') ? image : (DOMAIN + image),
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
                url: DOMAIN + mangaId,
                method,
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const chapters = [];
            var i = 0;
            for (const obj of $('.list-chapters > a').toArray().reverse()) {
                i++;
                let id = DOMAIN + $(obj).first().attr('href');
                let chapNum = parseFloat((_a = $('.chapter-name', obj).first().text()) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                let name = $('.chapter-view', obj).first().text().trim();
                let time = $('.chapter-time', obj).first().text().trim();
                // let H = time[0];
                // let D = time[1].split('/');
                chapters.push(createChapter({
                    id,
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: this.convertTime(time)
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
            for (let obj of $('.chapter-content img').toArray()) {
                let link = (_a = $(obj).attr('data-original')) !== null && _a !== void 0 ? _a : "";
                pages.push(link.replace(/\n/g, ''));
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
                title: "TRUYỆN HOT TRONG NGÀY",
                view_more: false,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "TRUYỆN MỚI CẬP NHẬT",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "TRUYỆN MỚI ĐĂNG",
                view_more: false,
            });
            //Load empty sections
            sectionCallback(hot);
            sectionCallback(newUpdated);
            sectionCallback(view);
            ///Get the section data
            // Hot
            let request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let popular = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let manga of $('.owl-item', '.owl-stage').toArray()) {
                const title = $('.series-title', manga).text().trim();
                const id = $('.thumb-wrapper > a', manga).attr('href');
                const image = (_a = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).css('background-image')) !== null && _a !== void 0 ? _a : "";
                const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
                const sub = $('.chapter-title > a', manga).text().trim();
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id,
                    image: (bg === null || bg === void 0 ? void 0 : bg.includes('http')) ? (bg) : ("https://manhuarock.net" + bg),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: sub.replace('Chap', 'Chương') }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            //New Updates
            // let request = createRequestObject({
            //     url: 'https://www.medoctruyentranh.net/de-xuat/cap-nhat-moi/2',
            //     method: "GET",
            // });
            // let htm = await this.requestManager.schedule(request, 1);
            // if (htm) {
            //     var data = htm.data.match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
            //     if (data) data = JSON.parse(data[1]);
            //     var novels = data.props.pageProps.initialState.more.moreList.list;
            //     var covers: any = [];
            //     novels.forEach((v: any) => {
            //         covers.push(v.coverimg)
            //     })
            //     return covers
            // }
            request = createRequestObject({
                url: DOMAIN + 'manga-list.html?listType=pagination&page=1&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=last_update&sort_type=DESC',
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
                let title = $('.series-title > a', element).text().trim();
                let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
                if (!(image === null || image === void 0 ? void 0 : image.includes('http'))) {
                    image = 'https://manhuarock.net' + image;
                }
                else {
                    image = image;
                }
                let id = (_b = $('.series-title > a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
                let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: id !== null && id !== void 0 ? id : "",
                    image: image !== null && image !== void 0 ? image : "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //view
            request = createRequestObject({
                url: DOMAIN,
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(5) .row').toArray()) {
                let title = $('.series-title > a', manga).text().trim();
                let image = $('.a6-ratio > .img-in-ratio', manga).attr("data-bg");
                if (!(image === null || image === void 0 ? void 0 : image.includes('http'))) {
                    image = 'https://manhuarock.net' + image;
                }
                else {
                    image = image;
                }
                let id = (_c = $('.series-title > a', manga).attr('href')) !== null && _c !== void 0 ? _c : title;
                let subtitle = $(".chapter-title > a", manga).text().trim();
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
                    url = DOMAIN + `manga-list.html?listType=pagination&page=${page}&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=last_update&sort_type=DESC`;
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
            let manga = ManhuaRockParser_1.parseViewMore($);
            metadata = !ManhuaRockParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                cate: '',
                translater: "",
                status: "",
                sort: "views",
                type: 'DESC'
            };
            tags.map((value) => {
                switch (value.split(".")[0]) {
                    case 'cate':
                        search.cate = (value.split(".")[1]);
                        break;
                    case 'translater':
                        search.translater = (value.split(".")[1]);
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
                }
            });
            const request = createRequestObject({
                url: encodeURI(`${DOMAIN}manga-list.html?listType=pagination&page=${page}&group=${search.translater}&m_status=${search.status}&name=${(_d = query.title) !== null && _d !== void 0 ? _d : ''}&genre=${search.cate}&sort=${search.sort}&sort_type=${search.type}`),
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = ManhuaRockParser_1.parseSearch($);
            metadata = !ManhuaRockParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
                    id: 'sort.name',
                    label: 'A-Z'
                },
                {
                    id: 'sort.views',
                    label: 'Lượt Xem'
                },
                {
                    id: 'sort.last_update',
                    label: 'Mới Cập Nhật'
                }
            ];
            const tagss = [
                {
                    id: 'type.ASC',
                    label: 'ASC'
                },
                {
                    id: 'type.DESC',
                    label: 'DESC'
                }
            ];
            const tags5 = [];
            const tags6 = [];
            const url = DOMAIN + `search`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            //the loai
            for (const tag of $('.navbar-nav > li.nav-item:nth-child(1) .no-gutters a.genres-item').toArray()) {
                const label = $(tag).text().trim();
                const id = 'cate.' + $(tag).attr('href').split('-the-loai-')[1].split('.')[0];
                if (!id || !label)
                    continue;
                tags.push({ id: id, label: label });
            }
            //trang thai
            for (const tag of $('select#TinhTrang option').toArray()) {
                var label = $(tag).text().trim();
                if (label === 'Hoàn thành') {
                    label = 'Đang tiến hành';
                }
                else if (label === 'Đang tiến hành') {
                    label = 'Hoàn thành';
                }
                const id = 'status.' + $(tag).attr('value');
                if (!id || !label)
                    continue;
                tags5.push({ id: id, label: label });
            }
            //nhom dich
            for (const tag of $('.navbar-nav > li.nav-item:nth-child(2) .no-gutters a.genres-item').toArray()) {
                const label = $(tag).text().trim();
                const id = 'translater.' + $(tag).attr('href').split('-nhom-dich-')[1].split('.')[0];
                ;
                if (!id || !label)
                    continue;
                tags6.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
                createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags2.map(x => createTag(x)) }),
                createTagSection({ id: '0', label: 'Kiểu sắp xếp', tags: tagss.map(x => createTag(x)) }),
                createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
                createTagSection({ id: '5', label: 'Nhóm dịch', tags: tags6.map(x => createTag(x)) }),
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
exports.ManhuaRock = ManhuaRock;
