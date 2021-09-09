(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
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
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    getTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return (_a = this.getSearchTags) === null || _a === void 0 ? void 0 : _a.call(this);
        });
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":2,"./Tracker":3}],5:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":4,"./models":47}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],11:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],12:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],13:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],14:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],15:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],16:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],17:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],18:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],19:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],20:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],21:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],22:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],23:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],24:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":9,"./Form":11,"./FormRow":10,"./Header":12,"./InputField":13,"./Label":14,"./Link":15,"./MultilineLabel":16,"./NavigationButton":17,"./OAuthButton":18,"./Section":19,"./Select":20,"./Stepper":21,"./Switch":22,"./WebViewButton":23}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],27:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],28:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],30:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],31:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],32:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],33:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],34:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],35:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],36:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],37:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],40:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],41:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],43:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],44:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],45:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],46:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],47:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);

},{"./Chapter":7,"./ChapterDetails":6,"./Constants":8,"./DynamicUI":24,"./HomeSection":25,"./Languages":26,"./Manga":29,"./MangaTile":27,"./MangaUpdate":28,"./PagedResults":30,"./RawData":31,"./RequestHeaders":32,"./RequestInterceptor":33,"./RequestManager":34,"./RequestObject":35,"./ResponseObject":36,"./SearchField":37,"./SearchRequest":38,"./SourceInfo":39,"./SourceManga":40,"./SourceStateManager":41,"./SourceTag":42,"./TagSection":43,"./TrackedManga":45,"./TrackedMangaChapterReadAction":44,"./TrackerActionQueue":46}],48:[function(require,module,exports){
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
exports.NetTruyen = exports.NetTruyenInfo = exports.isLastPage = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const DOMAIN = 'http://www.nettruyenpro.com/';
exports.isLastPage = ($) => {
    const current = $('ul.pagination > li.active > a').text();
    let total = $('ul.pagination > li.PagerSSCCells:last-child').text();
    if (current) {
        total = total !== null && total !== void 0 ? total : '';
        return (+total) === (+current);
    }
    return true;
};
exports.NetTruyenInfo = {
    version: '2.0.0',
    name: 'NetTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/tristanphan',
    description: 'Extension that pulls manga from NetTruyen.',
    hentaiSource: false,
    websiteBaseURL: DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: paperback_extensions_common_1.TagType.GREEN
        }
    ]
};
class NetTruyen extends paperback_extensions_common_1.Source {
    getMangaDetails(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}truyen-tranh/${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            for (let obj of $('li.kind > p.col-xs-8 > a').toArray()) {
                const label = $(obj).text();
                const id = (_b = (_a = $(obj).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop()) !== null && _b !== void 0 ? _b : label;
                tags.push(createTag({
                    label: label,
                    id: id,
                }));
            }
            const creator = $('ul.list-info > li.author > p.col-xs-8').text();
            return createManga({
                id: mangaId,
                author: creator,
                artist: creator,
                desc: $('div.detail-content > p').text(),
                titles: [$('h1.title-detail').text()],
                image: $('div.col-image > img').attr('src'),
                status: $('li.status > p.col-xs-8').text().toLowerCase().includes("hoàn thành") ? 0 : 1,
                rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: false,
                tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const chapters = [];
            const url = `${DOMAIN}truyen-tranh/${mangaId}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            for (let obj of $('li.row:not(.heading)', 'div.list-chapter').toArray()) {
                let id = $('div.chapter > a', obj).attr('href');
                if (!id)
                    continue;
                chapters.push(createChapter({
                    id,
                    chapNum: parseFloat($('a', obj).text().split(' ')[1]),
                    name: $('div.chapter > a', obj).text(),
                    mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: chapterId,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const pages = [];
            for (let obj of $('div.reading-detail > div.page-chapter > img').toArray()) {
                if (!obj.attribs['src'])
                    continue;
                pages.push('http:' + obj.attribs['src']);
            }
            return createChapterDetails({
                pages: pages,
                longStrip: false,
                id: chapterId,
                mangaId: mangaId,
            });
        });
    }
    searchRequest(query, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const url = `${DOMAIN}tim-truyen?keyword=${encodeURI(query.title)}`;
            const request = createRequestObject({
                url: url,
                method: "GET",
                param: `&page=${page}`
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            const tiles = [];
            for (const manga of $('div.item', 'div.row').toArray()) {
                const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
                const id = (_b = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop();
                const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
                const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
                if (!id || !title)
                    continue;
                tiles.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            return createPagedResults({
                results: tiles
            });
        });
    }
    getHomePageSections(sectionCallback) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let viewest = createHomeSection({
                id: 'viewest',
                title: "Truyện Xem Nhiều Nhất",
                view_more: true,
            });
            let hot = createHomeSection({
                id: 'hot',
                title: "Truyện Hot Nhất",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: 'new_updated',
                title: "Truyện Mới Cập Nhật",
                view_more: true,
            });
            let newAdded = createHomeSection({
                id: 'new_added',
                title: "Truyện Mới Thêm Gần Đây",
                view_more: true,
            });
            //View
            let url = `${DOMAIN}tim-truyen?status=-1&sort=10`;
            let request = createRequestObject({
                url: url,
                method: "GET",
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let viewestItems = [];
            for (let manga of $('div.item', 'div.row').toArray()) {
                const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
                const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
                const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
                const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
                if (!id || !title)
                    continue;
                viewestItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            viewest.items = viewestItems;
            sectionCallback(viewest);
            //Hot
            url = `${DOMAIN}hot`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            const TopWeek = [];
            for (const manga of $('div.item', 'div.row').toArray()) {
                const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
                const id = (_b = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop();
                const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
                const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
                if (!id || !title)
                    continue;
                TopWeek.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            hot.items = TopWeek;
            sectionCallback(hot);
            //New Updates
            url = `${DOMAIN}`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let newUpdatedItems = [];
            for (let manga of $('div.item', 'div.row').toArray()) {
                const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
                const id = (_c = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _c === void 0 ? void 0 : _c.split('/').pop();
                const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
                const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
                if (!id || !title)
                    continue;
                newUpdatedItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //New added
            url = `${DOMAIN}tim-truyen?status=-1&sort=15`;
            request = createRequestObject({
                url: url,
                method: "GET",
            });
            data = yield this.requestManager.schedule(request, 1);
            $ = this.cheerio.load(data.data);
            let newAddedItems = [];
            for (let manga of $('div.item', 'div.row').toArray()) {
                const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
                const id = (_d = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _d === void 0 ? void 0 : _d.split('/').pop();
                const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
                const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
                if (!id || !title)
                    continue;
                newAddedItems.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            newAdded.items = newAddedItems;
            sectionCallback(newAdded);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = "";
            let url = "";
            switch (homepageSectionId) {
                case "viewest":
                    param = `?status=-1&sort=10&page=${page}`;
                    url = `${DOMAIN}tim-truyen`;
                    break;
                case "hot":
                    param = `?page=${page}`;
                    url = `${DOMAIN}hot`;
                    break;
                case "new_updated":
                    param = `?page=${page}`;
                    url = DOMAIN;
                    break;
                case "new_added":
                    param = `?status=-1&sort=15&page=${page}`;
                    url = `${DOMAIN}tim-truyen`;
                    break;
                default:
                    throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
            }
            const request = createRequestObject({
                url,
                method: 'GET',
                param,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const mangas = [];
            // for (const manga of $("div.content-genres-item", "div.panel-content-genres").toArray()) {
            //     const title = $('img', manga).first().attr('alt') ?? "";
            //     const id = $('a.genres-item-name', manga).attr('href')?.split('/').pop();
            //     const image = $('img', manga).first().attr('src') ?? "";
            //     const subtitle = $("a.genres-item-chap.text-nowrap", manga).last().text().trim();
            //     if (!id || !title) continue;
            //     mangas.push(createMangaTile({
            //         id: id,
            //         image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            //         title: createIconText({ text: title }),
            //         subtitleText: createIconText({ text: subtitle }),
            //     }));
            // }
            for (const manga of $('div.item', 'div.row').toArray()) {
                const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
                const id = (_b = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop();
                const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
                const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
                if (!id || !title)
                    continue;
                mangas.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }
            const manga = mangas;
            metadata = exports.isLastPage($) ? undefined : { page: page + 1 };
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    globalRequestHeaders() {
        return {
            referer: DOMAIN
        };
    }
}
exports.NetTruyen = NetTruyen;

},{"paperback-extensions-common":5}]},{},[48])(48)
});
