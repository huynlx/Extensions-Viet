(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
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
    async getTags() {
        // @ts-ignore
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
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

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":1,"./Tracker":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);

},{"./base":3,"./models":46}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],8:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],9:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],10:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],11:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],12:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],13:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],15:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],16:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],17:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],18:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],19:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],20:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],21:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],22:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],23:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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

},{"./Button":8,"./Form":10,"./FormRow":9,"./Header":11,"./InputField":12,"./Label":13,"./Link":14,"./MultilineLabel":15,"./NavigationButton":16,"./OAuthButton":17,"./Section":18,"./Select":19,"./Stepper":20,"./Switch":21,"./WebViewButton":22}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],27:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],30:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],31:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],32:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],33:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],34:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],35:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],36:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],40:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],43:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],44:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],45:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],46:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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

},{"./Chapter":6,"./ChapterDetails":5,"./Constants":7,"./DynamicUI":23,"./HomeSection":24,"./Languages":25,"./Manga":28,"./MangaTile":26,"./MangaUpdate":27,"./PagedResults":29,"./RawData":30,"./RequestHeaders":31,"./RequestInterceptor":32,"./RequestManager":33,"./RequestObject":34,"./ResponseObject":35,"./SearchField":36,"./SearchRequest":37,"./SourceInfo":38,"./SourceManga":39,"./SourceStateManager":40,"./SourceTag":41,"./TagSection":42,"./TrackedManga":44,"./TrackedMangaChapterReadAction":43,"./TrackerActionQueue":45}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManhuaRock = exports.ManhuaRockInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Doctruyen3QParser_1 = require("./Doctruyen3QParser");
const DOMAIN = 'https://manhuarock.net/';
const method = 'GET';
exports.ManhuaRockInfo = {
    version: '2.0.0',
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
    }
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
            time = new Date(Date.now() - trimmed * 1000);
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
                let H = split[0];
                let D = split[1];
                let fixD = D.split('/');
                let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
                time = new Date(finalD + ' ' + H);
            }
            else {
                let split = timeAgo.split('/');
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time;
    }
    getMangaShareUrl(mangaId) { return (DOMAIN + mangaId); }
    ;
    async getMangaDetails(mangaId) {
        var _a, _b;
        const url = DOMAIN + mangaId;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
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
                    let status = $('a', test).text().trim();
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
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });
    }
    async getChapters(mangaId) {
        var _a;
        const request = createRequestObject({
            url: DOMAIN + mangaId,
            method,
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapters = [];
        var i = 0;
        for (const obj of $('.list-chapters > a').toArray().reverse()) {
            i++;
            let id = DOMAIN + $(obj).first().attr('href');
            let chapNum = parseFloat((_a = $('.chapter-name', obj).first().text()) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
            let name = $('.chapter-view', obj).first().text().trim();
            let time = $('.chapter-time', obj).first().text().trim();
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
    }
    async getChapterDetails(mangaId, chapterId) {
        var _a;
        const request = createRequestObject({
            url: `${chapterId}`,
            method
        });
        let data = await this.requestManager.schedule(request, 1);
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
    }
    async getHomePageSections(sectionCallback) {
        var _a, _b, _c;
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
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let popular = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('.owl-item', '.owl-stage').toArray()) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.thumb-wrapper > a', manga).attr('href');
            const image = (_a = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).css('background-image')) !== null && _a !== void 0 ? _a : "";
            const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
            const sub = $('.chapter-title > a', manga).text().trim();
            popular.push(createMangaTile({
                id: id,
                image: (bg === null || bg === void 0 ? void 0 : bg.includes('http')) ? (bg) : ("https://manhuarock.net" + bg),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub.replace('Chap', 'Chương') }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);
        request = createRequestObject({
            url: 'https://doctruyen3q.com/',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        let newUpdatedItems = [];
        for (const element of $('#home > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let image = $('.image-item > a > img', element).attr("src");
            let id = (_b = $('.caption > h3 > a', element).attr('href')) !== null && _b !== void 0 ? _b : title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id !== null && id !== void 0 ? id : "",
                image: image !== null && image !== void 0 ? image : "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let viewItems = [];
        data = await this.requestManager.schedule(request, 1);
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
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = DOMAIN + `manga-list.html?listType=pagination&page=${page}&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=last_update&sort_type=DESC`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }));
        }
        const request = createRequestObject({
            url,
            method
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let manga = Doctruyen3QParser_1.parseViewMore($);
        metadata = !Doctruyen3QParser_1.isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }
    async getSearchResults(query, metadata) {
        var _a, _b, _c, _d;
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
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = Doctruyen3QParser_1.parseSearch($);
        metadata = !Doctruyen3QParser_1.isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: tiles,
            metadata
        });
    }
    async getSearchTags() {
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
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (const tag of $('.navbar-nav > li.nav-item:nth-child(1) .no-gutters a.genres-item').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('href').split('-the-loai-')[1].split('.')[0];
            if (!id || !label)
                continue;
            tags.push({ id: id, label: label });
        }
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
    }
    globalRequestHeaders() {
        return {
            referer: DOMAIN
        };
    }
}
exports.ManhuaRock = ManhuaRock;

},{"./Doctruyen3QParser":48,"paperback-extensions-common":4}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.capitalizeFirstLetter = void 0;
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($) => {
    var _a;
    const manga = [];
    for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
        let title = $('.series-title > a', element).text().trim();
        let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
        if (!(image === null || image === void 0 ? void 0 : image.includes('http'))) {
            image = 'https://manhuarock.net' + image;
        }
        else {
            image = image;
        }
        let id = (_a = $('.series-title > a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
        let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.parseViewMore = ($) => {
    var _a;
    const manga = [];
    for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
        let title = $('.series-title > a', element).text().trim();
        let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
        if (!(image === null || image === void 0 ? void 0 : image.includes('http'))) {
            image = 'https://manhuarock.net' + image;
        }
        else {
            image = image;
        }
        let id = (_a = $('.series-title > a', element).attr('href')) !== null && _a !== void 0 ? _a : title;
        let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image !== null && image !== void 0 ? image : "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return manga;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li > a.active").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};

},{}]},{},[47])(47)
});
