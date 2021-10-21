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
exports.Truyendep = exports.TruyendepInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyendepParser_1 = require("./TruyendepParser");
const DOMAIN = 'https://truyendep.net/';
const method = 'GET';
exports.TruyendepInfo = {
    version: '2.4.0',
    name: 'Truyendep',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyendep',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        }
    ]
};
class Truyendep extends paperback_extensions_common_1.Source {
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
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: mangaId,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            // let html = Buffer.from(createByteArray(data.rawData)).toString()
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let status = 1;
            let creator = '';
            let desc = $('.entry-content').text();
            for (const t of $('.detail-manga-category a').toArray()) {
                const genre = $(t).text().trim();
                const id = (_b = (_a = $(t).attr('href')) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : genre;
                tags.push(createTag({ label: genre, id }));
            }
            for (const x of $('.truyen_info_right > li').toArray()) {
                switch ($('span', x).text().trim()) {
                    case "Tác Giả:":
                        creator = $('a', x).text().trim() ? $('a', x).text().trim() : $(x).clone().children().remove().end().text().trim();
                        break;
                    case "Trạng Thái :":
                        status = $('a', x).text().trim().toLowerCase().includes('đang') ? 1 : 0;
                        break;
                    case "Thể Loại :":
                        for (const t of $('a', x).toArray()) {
                            const genre = $(t).text().trim();
                            const id = (_c = $(t).attr('href')) !== null && _c !== void 0 ? _c : genre;
                            tags.push(createTag({ label: genre, id }));
                        }
                        break;
                }
            }
            const image = (_d = $('.truyen_info_left img').attr('src').replace('-162x250', '')) !== null && _d !== void 0 ? _d : "fuck";
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: TruyendepParser_1.decodeHTMLEntity(desc),
                titles: [TruyendepParser_1.decodeHTMLEntity($('.entry-title').text())],
                image: image,
                status,
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
            const response = yield this.requestManager.schedule(request, 1);
            // let html = Buffer.from(createByteArray(response.rawData)).toString()
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $(".chapter-list .row").toArray().reverse()) {
                var y = $('span:first-child', obj).text();
                var chapNum = i;
                i++;
                if (y.includes('chap') || y.includes('Chap') || y.includes('Chương')) {
                    chapNum = parseFloat(y.includes('chap') ? y.split('chap')[1].split(' ')[1] : (y.includes('Chap') ? y.split('Chap')[1].split(' ')[1] : y.split('Chương')[1].split(' ')[1]));
                }
                var time = $('span:last-child', obj).text().trim().split('-');
                chapters.push(createChapter({
                    id: $('span:first-child > a', obj).attr('href'),
                    chapNum: isNaN(chapNum) ? i : chapNum,
                    name: '',
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
                url: chapterId,
                method
            });
            const response = yield this.requestManager.schedule(request, 1);
            let arrayImages = (_a = response.data.match(/var content=(.*);/)) === null || _a === void 0 ? void 0 : _a[1];
            let x = arrayImages === null || arrayImages === void 0 ? void 0 : arrayImages.replace(',]', ']');
            let listImages = JSON.parse(x !== null && x !== void 0 ? x : "");
            const pages = [];
            for (let i in listImages) {
                pages.push(`https://1.truyentranhmanga.com/images/${mangaId.split('/')[3]}/${chapterId.split('/')[3]}/${i}.${listImages[i].includes('webp') ? 'webp' : 'jpg'}`);
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
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: 'featured',
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured
            });
            let highlight = createHomeSection({
                id: 'highlight',
                title: "TRUYỆN NỔI BẬT",
                view_more: false,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "HOT",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "MỚI CẬP NHẬT",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "MỚI ĐĂNG",
                view_more: true,
            });
            let view = createHomeSection({
                id: 'view',
                title: "TOP VIEW",
                view_more: true,
            });
            let full = createHomeSection({
                id: 'full',
                title: "HOÀN THÀNH",
                view_more: true,
            });
            //Load empty sections
            sectionCallback(featured);
            sectionCallback(highlight);
            sectionCallback(newUpdated);
            sectionCallback(newAdded);
            sectionCallback(hot);
            sectionCallback(view);
            sectionCallback(full);
            ///Get the section data
            //featured
            let request = createRequestObject({
                url: 'https://truyendep.net/',
                method: "GET",
            });
            let featuredItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let manga of $('.top_thang li').toArray()) {
                const title = $('a', manga).last().text().trim();
                const id = (_a = $('a', manga).first().attr('href')) !== null && _a !== void 0 ? _a : title;
                const image = $('a:first-child img', manga).attr('src').split('-');
                const ext = image.splice(-1)[0].split('.')[1];
                // const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
                // if (!id || !subtitle) continue;
                featuredItems.push(createMangaTile({
                    id: id,
                    image: image.join('-') + '.' + ext,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                }));
            }
            featured.items = featuredItems;
            sectionCallback(featured);
            //highlight
            request = createRequestObject({
                url: 'https://truyendep.net',
                method: "GET",
            });
            let highlightItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.popular-manga li').toArray()) {
                const title = $('a', manga).first().attr('title');
                const id = (_b = $('a', manga).first().attr('href')) !== null && _b !== void 0 ? _b : title;
                const image = $('a:first-child img', manga).attr('src').replace('-61x61', '');
                const sub = $('i', manga).text().split(":")[1].trim();
                // if (!id || !subtitle) continue;
                highlightItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            highlight.items = highlightItems;
            sectionCallback(highlight);
            //New Updates
            request = createRequestObject({
                url: 'https://truyendep.net/moi-cap-nhat/',
                method: "GET",
            });
            let newUpdatedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.wrap_update .update_item').toArray()) {
                const title = $('a', manga).first().attr('title');
                const id = (_c = $('a', manga).first().attr('href')) !== null && _c !== void 0 ? _c : title;
                const image = $('.update_image img', manga).attr('src').replace('-61x61', '');
                const sub = 'Chap' + $('a:nth-of-type(1)', manga).text().trim().split('chap')[1];
                // if (!id || !subtitle) continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //New Added
            request = createRequestObject({
                url: 'https://truyendep.net/moi-dang/',
                method: "GET",
            });
            let newAddItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.wrap_update .update_item').toArray()) {
                const title = $('h3.nowrap a', manga).attr('title');
                const id = (_d = $('h3.nowrap a', manga).attr('href')) !== null && _d !== void 0 ? _d : title;
                const image = $('a img', manga).attr('src').split('-');
                const ext = image.splice(-1)[0].split('.')[1];
                const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
                // if (!id || !subtitle) continue;
                newAddItems.push(createMangaTile({
                    id: id,
                    image: image.join('-') + '.' + ext,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newAdded.items = newAddItems;
            sectionCallback(newAdded);
            // Hot
            request = createRequestObject({
                url: 'https://truyendep.net/hot/',
                method: "GET",
            });
            let popular = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.wrap_update .update_item').toArray()) {
                const title = $('h3.nowrap a', manga).attr('title');
                const id = (_e = $('h3.nowrap a', manga).attr('href')) !== null && _e !== void 0 ? _e : title;
                const image = $('a img', manga).attr('src').split('-');
                const ext = image.splice(-1)[0].split('.')[1];
                const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
                // if (!id || !title) continue;
                popular.push(createMangaTile({
                    id: id,
                    image: image.join('-') + '.' + ext,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            hot.items = popular;
            sectionCallback(hot);
            // view
            request = createRequestObject({
                url: 'https://truyendep.net/top-view/',
                method: "GET",
            });
            let viewItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.wrap_update .update_item').toArray()) {
                const title = $('h3.nowrap a', manga).attr('title');
                const id = (_f = $('h3.nowrap a', manga).attr('href')) !== null && _f !== void 0 ? _f : title;
                const image = $('a img', manga).attr('src').split('-');
                const ext = image.splice(-1)[0].split('.')[1];
                const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
                // if (!id || !title) continue;
                viewItems.push(createMangaTile({
                    id: id,
                    image: image.join('-') + '.' + ext,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            view.items = viewItems;
            sectionCallback(view);
            // full
            request = createRequestObject({
                url: 'https://truyendep.net/full/',
                method: "GET",
            });
            let fullItems = [];
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            for (let manga of $('.wrap_update .update_item').toArray()) {
                const title = $('h3.nowrap a', manga).attr('title');
                const id = (_g = $('h3.nowrap a', manga).attr('href')) !== null && _g !== void 0 ? _g : title;
                const image = $('a img', manga).attr('src').split('-');
                const ext = image.splice(-1)[0].split('.')[1];
                const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
                // if (!id || !title) continue;
                fullItems.push(createMangaTile({
                    id: id,
                    image: image.join('-') + '.' + ext,
                    title: createIconText({
                        text: TruyendepParser_1.decodeHTMLEntity(title),
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            full.items = fullItems;
            sectionCallback(full);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            let url = '';
            let select = 1;
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://truyendep.net/moi-cap-nhat/page/${page}/`;
                    select = 1;
                    break;
                case "new_added":
                    url = `https://truyendep.net/moi-dang/page/${page}`;
                    select = 2;
                    break;
                case "hot":
                    url = `https://truyendep.net/hot/page/${page}`;
                    select = 2;
                    break;
                case "view":
                    url = `https://truyendep.net/top-view/page/${page}`;
                    select = 2;
                    break;
                case "full":
                    url = `https://truyendep.net/full/page/${page}`;
                    select = 2;
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
            const manga = TruyendepParser_1.parseViewMore($, select);
            metadata = !TruyendepParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const request = createRequestObject({
                url: query.title ? (`https://truyendep.net/wp-content/themes/manga/list-manga-front.js?nocache=1634580614`)
                    : (tags[0].includes('tieudiem') ? DOMAIN : `${tags[0]}/page/${page}/`),
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let tiles = [];
            if (query.title) {
                var json = JSON.parse(data.data).filter(function (el) {
                    var _a, _b;
                    return (el.label.toLowerCase() + "::" + TruyendepParser_1.ChangeToSlug(el.label)).includes((_b = (_a = query.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : "");
                });
                for (let manga of json) {
                    const title = manga.label;
                    const id = manga.link;
                    const image = manga.img.split('-');
                    const ext = image === null || image === void 0 ? void 0 : image.splice(-1)[0].split('.')[1];
                    tiles.push(createMangaTile({
                        id: id,
                        image: (image === null || image === void 0 ? void 0 : image.join('-')) + '.' + ext,
                        title: createIconText({
                            text: TruyendepParser_1.decodeHTMLEntity(title),
                        })
                    }));
                }
                metadata = undefined;
            }
            else {
                let $ = this.cheerio.load(data.data);
                if (tags[0].includes('tieudiem')) {
                    for (let manga of $('.feature_topxem a').toArray()) {
                        const title = (_d = $('img', manga).attr('title')) !== null && _d !== void 0 ? _d : "";
                        const id = (_e = $(manga).attr('href')) !== null && _e !== void 0 ? _e : title;
                        const image = (_f = $('img', manga).attr('src')) === null || _f === void 0 ? void 0 : _f.split('-');
                        const ext = image === null || image === void 0 ? void 0 : image.splice(-1)[0].split('.')[1];
                        tiles.push(createMangaTile({
                            id: id,
                            image: (image === null || image === void 0 ? void 0 : image.join('-')) + '.' + ext,
                            title: createIconText({
                                text: TruyendepParser_1.decodeHTMLEntity(title),
                            })
                        }));
                    }
                    let request2 = createRequestObject({
                        url: "https://truyendep.net/wp-content/themes/manga/focus.html?nocache=1634673567",
                        method: "GET",
                    });
                    let data2 = yield this.requestManager.schedule(request2, 1);
                    let $2 = this.cheerio.load(data2.data);
                    for (let manga of $2('.wrap-focus a').toArray()) {
                        const title = (_g = $('img', manga).attr('title')) !== null && _g !== void 0 ? _g : "";
                        const id = (_h = $(manga).attr('href')) !== null && _h !== void 0 ? _h : title;
                        const image = (_j = $('img', manga).attr('src')) === null || _j === void 0 ? void 0 : _j.split('-');
                        const ext = image === null || image === void 0 ? void 0 : image.splice(-1)[0].split('.')[1];
                        tiles.push(createMangaTile({
                            id: id,
                            image: (image === null || image === void 0 ? void 0 : image.join('-')) + '.' + ext,
                            title: createIconText({
                                text: TruyendepParser_1.decodeHTMLEntity(title),
                            })
                        }));
                    }
                    metadata = undefined;
                }
                else {
                    tiles = TruyendepParser_1.parseSearch($);
                    metadata = !TruyendepParser_1.isLastPage($) ? { page: page + 1 } : undefined;
                }
            }
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
            const arrayTags = [{
                    label: 'Tiêu điểm',
                    id: 'tieudiem'
                }];
            const collectedIds = [];
            //the loai
            for (const tag of $('.theloai a').toArray()) {
                arrayTags.push({ id: $(tag).attr('href'), label: $(tag).text().trim() });
            }
            const tagSections = [
                createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
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
exports.Truyendep = Truyendep;
