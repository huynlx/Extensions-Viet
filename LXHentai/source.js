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

},{"./base":3,"./models":47}],5:[function(require,module,exports){
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

},{"./Button":8,"./Form":9,"./FormRow":10,"./Header":11,"./InputField":12,"./Label":13,"./Link":14,"./MultilineLabel":15,"./NavigationButton":16,"./OAuthButton":17,"./Section":18,"./Select":19,"./Stepper":20,"./Switch":21,"./WebViewButton":22}],24:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],28:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],29:[function(require,module,exports){
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
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],38:[function(require,module,exports){
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
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],41:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],42:[function(require,module,exports){
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
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],44:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],45:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],46:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],47:[function(require,module,exports){
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
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./ChapterDetails"), exports);
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
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);
__exportStar(require("./SearchFilter"), exports);

},{"./Chapter":5,"./ChapterDetails":6,"./Constants":7,"./DynamicUI":23,"./HomeSection":24,"./Languages":25,"./Manga":26,"./MangaTile":27,"./MangaUpdate":28,"./PagedResults":29,"./RawData":30,"./RequestHeaders":31,"./RequestInterceptor":32,"./RequestManager":33,"./RequestObject":34,"./ResponseObject":35,"./SearchField":36,"./SearchFilter":37,"./SearchRequest":38,"./SourceInfo":39,"./SourceManga":40,"./SourceStateManager":41,"./SourceTag":42,"./TagSection":43,"./TrackedManga":44,"./TrackedMangaChapterReadAction":45,"./TrackerActionQueue":46}],48:[function(require,module,exports){
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
exports.LXHentai = exports.LXHentaiInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const LXHentaiParser_1 = require("./LXHentaiParser");
const DOMAIN = "https://lxmanga.click/";
const method = "GET";
exports.LXHentaiInfo = {
    version: "2.0.2",
    name: "LXHentai",
    icon: "icon.png",
    author: "Huynhzip3",
    authorWebsite: "https://github.com/huynh12345678",
    description: "Extension that pulls manga from LXHentai",
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW,
        },
    ],
};
class LXHentai extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000,
            interceptor: {
                interceptRequest: (request) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    request.headers = Object.assign(Object.assign({}, ((_a = request.headers) !== null && _a !== void 0 ? _a : {})), {
                        referer: DOMAIN,
                    });
                    return request;
                }),
                interceptResponse: (response) => __awaiter(this, void 0, void 0, function* () {
                    return response;
                }),
            },
        });
    }
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = trimmed == 0 && timeAgo.includes("a") ? 1 : trimmed;
        if (timeAgo.includes("giây") || timeAgo.includes("secs")) {
            time = new Date(Date.now() - trimmed * 1000); // => mili giây (1000 ms = 1s)
        }
        else if (timeAgo.includes("phút")) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes("giờ")) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes("ngày")) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes("tháng")) {
            time = new Date(Date.now() - trimmed * 30 * 86400000); // approx. 30 days per month
        }
        else if (timeAgo.includes("năm")) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            if (timeAgo.includes(":")) {
                let split = timeAgo.split(" ");
                let H = split[0]; //vd => 21:08
                let D = split[1]; //vd => 25/08
                let fixD = D.split("/");
                let finalD = fixD[1] + "/" + fixD[0] + "/" + new Date().getFullYear();
                time = new Date(finalD + " " + H);
            }
            else {
                let split = timeAgo.split("/"); //vd => 05/12/18
                time = new Date(split[1] + "/" + split[0] + "/" + "20" + split[2]);
            }
        }
        return time;
    }
    getMangaShareUrl(mangaId) {
        return `${mangaId}`;
    }
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${mangaId}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 10);
            let $ = this.cheerio.load(data.data);
            let tags = [];
            let creator = "";
            let status = 1; //completed, 1 = Ongoing
            let artist = "";
            let desc = $(".py-4.border-t.border-gray-200 > p:nth-last-child(2)").text();
            creator = $("span:contains('Tác giả:')").next().text();
            status = $("span:contains('Tình trạng:')")
                .next()
                .text()
                .toLowerCase()
                .includes("đã")
                ? 0
                : 1;
            for (const t of $("a", $("span:contains('Thể loại:')").next()).toArray()) {
                const genre = $(t).text().trim();
                const id = (_a = $(t).attr("href")) !== null && _a !== void 0 ? _a : genre;
                tags.push(createTag({ label: genre, id }));
            }
            artist = $("span:contains('Thực hiện:')").next().text();
            const image = $("div.cover-frame > .cover").css("background-image");
            const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
            return createManga({
                id: mangaId,
                author: creator,
                artist: artist,
                desc: desc,
                titles: [
                    $(".grow.text-lg.ml-1.text-ellipsis.font-semibold").first().text(),
                ],
                image: bg || "",
                status: status,
                // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
                hentai: true,
                tags: [createTagSection({ label: "genres", tags: tags, id: "0" })],
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
            const $ = this.cheerio.load(response.data);
            const chapters = [];
            var i = 0;
            for (const obj of $("ul.overflow-y-auto.overflow-x-hidden > a")
                .toArray()
                .reverse()) {
                i++;
                let time = $(".hidden > span.timeago", obj).attr("datetime");
                let view = $(".hidden > span", obj).first().text();
                let number = $(".text-ellipsis", obj).text().split(" ")[1];
                chapters.push(createChapter({
                    id: "https://lxmanga.click" + $(obj).attr("href"),
                    chapNum: parseFloat(number) || i,
                    name: parseFloat(number) ? "" : number,
                    mangaId: mangaId,
                    langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                    time: new Date(time),
                    group: view + " lượt xem",
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: chapterId,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(response.data);
            const pages = [];
            const list = $(".text-center > #image-container").toArray();
            for (let obj of list) {
                let link = $(obj).attr("data-src");
                pages.push(encodeURI(link));
            }
            const chapterDetails = createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false,
            });
            return chapterDetails;
        });
    }
    getHomePageSections(sectionCallback) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let featured = createHomeSection({
                id: "featured",
                title: "Truyện Đề Cử",
                type: paperback_extensions_common_1.HomeSectionType.featured,
            });
            let mostViewed = createHomeSection({
                id: "most_viewed",
                title: "Xem nhiều nhất",
                view_more: true,
            });
            let newUpdated = createHomeSection({
                id: "new_updated",
                title: "Mới cập nhật",
                view_more: true,
            });
            let hot = createHomeSection({
                id: "hot",
                title: "Hot nhất",
                view_more: false,
            });
            sectionCallback(newUpdated);
            sectionCallback(hot);
            sectionCallback(mostViewed);
            sectionCallback(featured);
            //New Updates
            let request = createRequestObject({
                url: "https://lxmanga.click/tim-kiem?sort=-updated_at&filter[status]=2,1&page=1",
                method: "GET",
            });
            let newUpdatedItems = [];
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            // let html = Buffer.from(createByteArray(data.rawData)).toString();
            // let $ = this.cheerio.load(html);
            for (let manga of $("div.manga-vertical", ".grid")
                .toArray()
                .splice(0, 15)) {
                const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
                    .text()
                    .trim();
                const id = (_a = $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href")) !== null && _a !== void 0 ? _a : title;
                const image = $("div.cover-frame > div.cover", manga).css("background-image");
                const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
                const sub = $("div.latest-chapter > a", manga).first().text().trim();
                newUpdatedItems.push(createMangaTile({
                    id: "https://lxmanga.click" + id,
                    image: bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            newUpdated.items = newUpdatedItems;
            sectionCallback(newUpdated);
            //Hot
            request = createRequestObject({
                url: "https://lxmanga.click",
                method: "GET",
            });
            let hotItems = [];
            data = yield this.requestManager.schedule(request, 1);
            // html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(data.data);
            for (let manga of $("div.manga-vertical", "ul.glide__slides")
                .toArray()
                .splice(0, 15)) {
                const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
                    .text()
                    .trim();
                const id = (_b = $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href")) !== null && _b !== void 0 ? _b : title;
                const image = $("div.cover-frame > div.cover", manga).css("background-image");
                const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
                const sub = $("div.latest-chapter > a", manga).first().text().trim();
                hotItems.push(createMangaTile({
                    id: "https://lxmanga.click" + id,
                    image: bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            hot.items = hotItems;
            sectionCallback(hot);
            //Most Viewed
            request = createRequestObject({
                url: "https://lxmanga.click/tim-kiem?sort=-views&filter[status]=2,1&page=1",
                method: "GET",
            });
            let mostViewedItems = [];
            data = yield this.requestManager.schedule(request, 1);
            // html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(data.data);
            for (let manga of $("div.manga-vertical", ".grid")
                .toArray()
                .splice(0, 15)) {
                const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
                    .text()
                    .trim();
                const id = (_c = $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href")) !== null && _c !== void 0 ? _c : title;
                const image = $("div.cover-frame > div.cover", manga).css("background-image");
                const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
                const sub = $("div.latest-chapter > a", manga).first().text().trim();
                mostViewedItems.push(createMangaTile({
                    id: "https://lxmanga.click" + id,
                    image: bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
                }));
            }
            mostViewed.items = mostViewedItems;
            sectionCallback(mostViewed);
            //Có thể bạn muốn đọc
            request = createRequestObject({
                url: "https://lxmanga.click/",
                method: "GET",
            });
            let featuredItems = [];
            data = yield this.requestManager.schedule(request, 1);
            // html = Buffer.from(createByteArray(data.rawData)).toString();
            $ = this.cheerio.load(data.data);
            for (let manga of $("div.manga-vertical", ".mt-4.grid.gap-3")
                .toArray()
                .splice(0, 15)) {
                const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
                    .text()
                    .trim();
                const id = (_d = $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href")) !== null && _d !== void 0 ? _d : title;
                const image = $("div.cover-frame > div.cover", manga).css("background-image");
                const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
                const sub = $("div.latest-chapter > a", manga).first().text().trim();
                featuredItems.push(createMangaTile({
                    id: "https://lxmanga.click" + id,
                    image: bg,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: sub,
                    }),
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
            let param = "";
            let url = "";
            switch (homepageSectionId) {
                case "new_updated":
                    url = `https://lxmanga.click/tim-kiem?sort=-updated_at&filter[status]=2,1&page=${page}`;
                    break;
                case "most_viewed":
                    url = `https://lxmanga.click/tim-kiem?sort=-views&filter[status]=2,1&page=${page}`;
                    break;
                default:
                    return Promise.resolve(createPagedResults({ results: [] }));
            }
            const request = createRequestObject({
                url,
                method,
                param,
            });
            let data = yield this.requestManager.schedule(request, 1);
            // let html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(data.data);
            const manga = LXHentaiParser_1.parseViewMore($);
            metadata = !LXHentaiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
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
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map((tag) => tag.id)) !== null && _c !== void 0 ? _c : [];
            const request = createRequestObject({
                url: query.title
                    ? `https://lxmanga.click/tim-kiem?sort=-updated_at&filter[name]=${encodeURI(query.title)}&filter[status]=2,1&page=${page}`
                    : `${tags[0]}&p=${page}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            // const html = Buffer.from(createByteArray(data.rawData)).toString();
            let $ = this.cheerio.load(data.data);
            const tiles = LXHentaiParser_1.parseSearch($, query);
            metadata = !LXHentaiParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata,
            });
        });
    }
    getSearchTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://lxmanga.click`;
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            // const html = Buffer.from(createByteArray(response.rawData)).toString();
            const $ = this.cheerio.load(response.data);
            const arrayTags = [];
            //the loai
            for (const tag of $(".col-sm-3 a", "#showTheLoai").toArray()) {
                const label = $(tag).text().trim();
                const id = (_a = "https://lxmanga.click" + $(tag).attr("href")) !== null && _a !== void 0 ? _a : label;
                if (!id || !label)
                    continue;
                arrayTags.push({ id: id, label: label });
            }
            const tagSections = [
                createTagSection({
                    id: "0",
                    label: "Thể Loại",
                    tags: arrayTags.map((x) => createTag(x)),
                }),
            ];
            return tagSections;
        });
    }
}
exports.LXHentai = LXHentai;

},{"./LXHentaiParser":49,"paperback-extensions-common":4}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseTags = exports.parseViewMore = exports.parseSearch = exports.generateSearch = void 0;
exports.generateSearch = (query) => {
    var _a;
    let keyword = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(keyword);
};
exports.parseSearch = ($, query) => {
    var _a;
    const manga = [];
    for (let obj of $("div.manga-vertical", ".grid").toArray()) {
        const title = $("div.p-2.w-full.truncate > a.text-ellipsis", obj)
            .text()
            .trim();
        const id = (_a = $("div.p-2.w-full.truncate > a.text-ellipsis", obj).attr("href")) !== null && _a !== void 0 ? _a : title;
        const image = $("div.cover-frame > div.cover", obj).css("background-image");
        const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
        const sub = $("div.latest-chapter > a", obj).first().text().trim();
        manga.push(createMangaTile({
            id: "https://lxmanga.click" + id,
            image: bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }));
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
};
exports.parseViewMore = ($) => {
    var _a;
    const manga = [];
    // const collectedIds: string[] = [];
    for (let obj of $("div.manga-vertical", ".grid").toArray()) {
        const title = $("div.p-2.w-full.truncate > a.text-ellipsis", obj)
            .text()
            .trim();
        const id = (_a = $("div.p-2.w-full.truncate > a.text-ellipsis", obj).attr("href")) !== null && _a !== void 0 ? _a : title;
        const image = $("div.cover-frame > div.cover", obj).css("background-image");
        const bg = image === null || image === void 0 ? void 0 : image.replace("url(", "").replace(")", "").replace(/\"/gi, "").replace(/['"]+/g, "");
        const sub = $("div.latest-chapter > a", obj).first().text().trim();
        manga.push(createMangaTile({
            id: "https://lxmanga.click" + id,
            image: bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }));
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
};
exports.parseTags = ($) => {
    var _a;
    const arrayTags = [];
    for (const obj of $("li", "ul").toArray()) {
        const label = $("a", obj).text().trim();
        const id = (_a = $("a", obj).attr("href")) !== null && _a !== void 0 ? _a : "";
        if (id == "")
            continue;
        arrayTags.push({
            id: id,
            label: label,
        });
    }
    const tagSections = [
        createTagSection({
            id: "0",
            label: "Thể Loại",
            tags: arrayTags.map((x) => createTag(x)),
        }),
    ];
    return tagSections;
};
exports.isLastPage = ($) => {
    let isLast = false;
    // const pages = [];
    // for (const page of $("li", "ul.pagination").toArray()) {
    //   const p = Number($("a", page).text().trim());
    //   if (isNaN(p)) continue;
    //   pages.push(p);
    // }
    // const lastPage = Math.max(...pages);
    // const currentPage = Number($("li.active > a").text().trim());
    // if (currentPage >= lastPage) isLast = true;
    return isLast;
};
// const decodeHTMLEntity = (str: string): string => {
//     return entities.decodeHTML(str);
// }

},{}]},{},[48])(48)
});
