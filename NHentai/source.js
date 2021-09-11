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
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = exports.PAGES = exports.TYPE = exports.QUERY = exports.NHENTAI_DOMAIN = void 0;
// Exports
exports.NHENTAI_DOMAIN = 'https://nhentai.net';
// Makes a request into a url format.
exports.QUERY = (query, sort, page) => `${exports.NHENTAI_DOMAIN}/api/galleries/search?query=${query ? query : ''}&sort=${sort ? sort : 'popular'}&page=${page ? page : 1}`;
// Don't think about this too much, appends the missing letters to finish the extension. (￣ω￣)
exports.TYPE = (type) => {
    if (type === 'j')
        return type + 'pg';
    if (type === 'p')
        return type + 'ng';
    else
        return type + 'if';
};
// Blame Eslint
exports.PAGES = (images, media_Id) => images.pages.map((page, i) => `https://i.nhentai.net/galleries/${media_Id}/${[i + 1]}.${exports.TYPE(page.t)}`);
// Makes the first letter of a string capital.
exports.capitalize = (str) => {
    const cappedString = str
        .toString()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())[0];
    if (!cappedString)
        return 'Not Available';
    else
        return cappedString;
};

},{}],49:[function(require,module,exports){
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
exports.NHentai = exports.NHentaiInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Functions_1 = require("./Functions");
exports.NHentaiInfo = {
    version: "2.2.1",
    name: "nHentai",
    description: `Extension which pulls 18+ content from nHentai. (Literally all of it. We know why you're here)`,
    author: `VibrantClouds`,
    authorWebsite: `https://github.com/conradweiser`,
    icon: `icon.png`,
    sourceTags: [{ text: "18+", type: paperback_extensions_common_1.TagType.YELLOW }],
    websiteBaseURL: Functions_1.NHENTAI_DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
};
class NHentai extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 4,
            requestTimeout: 15000,
        });
    }
    convertLanguageToCode(language) {
        switch (language.toLowerCase()) {
            case "english":
                return paperback_extensions_common_1.LanguageCode.ENGLISH;
            case "japanese":
                return paperback_extensions_common_1.LanguageCode.JAPANESE;
            case "chinese":
                return paperback_extensions_common_1.LanguageCode.CHINEESE;
            default:
                return paperback_extensions_common_1.LanguageCode.UNKNOWN;
        }
    }
    // Makes my life easy... ＼(≧▽≦)／
    getResponse(mangaId, methodName) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: Functions_1.NHENTAI_DOMAIN + "/api/gallery/" + mangaId,
                method: "GET",
                headers: {
                    "accept-encoding": "application/json",
                },
            });
            const response = yield this.requestManager.schedule(request, 1);
            if (response.status > 400)
                throw new Error(`Failed to fetch data on ${methodName} with status code: ` +
                    `${response.status}. Request URL: ${request.url}`);
            const json = typeof response.data !== "object"
                ? JSON.parse(response.data)
                : response.data;
            if (!json)
                throw new Error(`Failed to parse response on ${methodName}`);
            return json;
        });
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const json = yield this.getResponse(mangaId, this.getMangaDetails.name);
            const artist = [];
            const categories = [];
            const characters = [];
            const tags = [];
            // Iterates over tags and check for types while pushing them to the related arrays.
            json.tags.forEach((tag) => {
                if (!tag.type || !tag.name || tag.type === "language")
                    return;
                // Return on undefined and language is not a tag.
                else if (tag.type === "artist")
                    return artist.push(Functions_1.capitalize(tag.name));
                else if (tag.type === "category")
                    return categories.push(createTag({ id: tag.id.toString(), label: Functions_1.capitalize(tag.name) }));
                else if (tag.type === "character")
                    return characters.push(createTag({ id: tag.id.toString(), label: Functions_1.capitalize(tag.name) }));
                else
                    return tags.push(createTag({ id: tag.id.toString(), label: Functions_1.capitalize(tag.name) }));
            });
            const TagSections = [];
            if (tags.length)
                TagSections.push(createTagSection({
                    id: "tags",
                    label: "Tags",
                    tags: tags,
                }));
            if (characters.length)
                TagSections.push(createTagSection({
                    id: "characters",
                    label: "Characters",
                    tags: characters,
                }));
            if (categories.length)
                TagSections.push(createTagSection({
                    id: "category",
                    label: "Categories",
                    tags: categories,
                }));
            return createManga({
                id: json.id.toString(),
                titles: [json.title.pretty, json.title.english, json.title.japanese],
                image: `https://t.nhentai.net/galleries/${json.media_id}/1t.${Functions_1.TYPE(json.images.thumbnail.t)}`,
                rating: 0,
                status: 1,
                artist: artist.join(", "),
                author: artist.join(", "),
                hentai: false,
                tags: TagSections,
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const json = yield this.getResponse(mangaId, this.getChapters.name);
            let language = "";
            json.tags.forEach((tag) => {
                if (tag.type === "language" && tag.id !== 17249)
                    return (language += Functions_1.capitalize(tag.name));
                // Tag id 17249 is "Translated" tag and it belongs to "language" type.
                else
                    return;
            });
            return [
                createChapter({
                    id: json.media_id,
                    name: json.title.pretty,
                    mangaId: json.id.toString(),
                    chapNum: 1,
                    group: json.scanlator ? json.scanlator : undefined,
                    langCode: this.convertLanguageToCode(language),
                    time: new Date(json.upload_date * 1000),
                }),
            ];
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const methodName = this.getChapterDetails.name;
            if (!chapterId)
                throw new Error(`ChapterId is empty. ${methodName}.`);
            const json = yield this.getResponse(mangaId, methodName);
            return createChapterDetails({
                id: json.media_id,
                mangaId: json.id.toString(),
                pages: Functions_1.PAGES(json.images, json.media_id),
                longStrip: false,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const methodName = this.searchRequest.name;
            // Sets metadata if not available.
            metadata = metadata ? metadata : { nextPage: 1, sort: "popular" };
            // Returns an empty result if the page limit is passed.
            if (metadata.nextPage == undefined)
                return createPagedResults({
                    results: [],
                    metadata: { nextPage: undefined, maxPages: metadata.maxPages },
                });
            let title = "";
            // On URL title becomes a nhentai id.
            if (((_a = query.title) === null || _a === void 0 ? void 0 : _a.startsWith("https")) || ((_b = query.title) === null || _b === void 0 ? void 0 : _b.startsWith("nhentai.net")))
                title += query.title.replace(/[^0-9]/g, "");
            else
                title += query.title;
            // If the query title is a number, returns the result with that number as it's id.
            // Could use typeof here but idk.
            if (!isNaN(parseInt(title))) {
                const response = yield this.getResponse(title, methodName);
                return createPagedResults({
                    results: [
                        createMangaTile({
                            id: response.id.toString(),
                            title: createIconText({ text: response.title.pretty }),
                            image: `https://t.nhentai.net/galleries/${response.media_id}/1t.${Functions_1.TYPE(response.images.thumbnail.t)}`,
                        }),
                    ],
                    metadata: { nextPage: undefined, maxPages: 1 },
                });
            }
            const request = createRequestObject({
                url: Functions_1.QUERY(encodeURI(title), metadata.sort ? metadata.sort : "popular", metadata.nextPage),
                method: "GET",
                headers: {
                    "accept-encoding": "application/json",
                },
            });
            const response = yield this.requestManager.schedule(request, 1);
            if (response.status > 400)
                throw new Error(`Failed to fetch data on ${methodName} with status code: ` +
                    `${response.status}. Request URL: ${request.url}`);
            const json = typeof response.data !== "object"
                ? JSON.parse(response.data)
                : response.data;
            if (!json)
                throw new Error(`Failed to parse response on ${methodName}`);
            const cache = json.result.map((result) => createMangaTile({
                id: result.id.toString(),
                title: createIconText({ text: result.title.pretty }),
                image: `https://t.nhentai.net/galleries/${result.media_id}/1t.${Functions_1.TYPE(result.images.thumbnail.t)}`,
            }));
            if (metadata.nextPage === json.num_pages || json.num_pages === 0)
                metadata = {
                    nextPage: undefined,
                    maxPages: json.num_pages,
                    sort: metadata.sort,
                };
            else
                metadata = {
                    nextPage: ++metadata.nextPage,
                    maxPages: json.num_pages,
                    sort: metadata.sort,
                };
            return createPagedResults({
                results: cache,
                metadata: metadata,
            });
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const [popular, newUploads] = [
                createHomeSection({
                    id: "popular",
                    title: "Popular Now",
                    view_more: false,
                }),
                createHomeSection({
                    id: "new",
                    title: "New Uploads",
                    view_more: true,
                }),
            ];
            sectionCallback(popular);
            sectionCallback(newUploads);
            const request = createRequestObject({
                url: `${Functions_1.NHENTAI_DOMAIN}`,
                method: "GET",
            });
            const response = yield this.requestManager.schedule(request, 1);
            if (response.status > 400)
                throw new Error(`Failed to fetch data on ${this.getHomePageSections.name} with status code: ` +
                    `${response.status}. Request URL: ${request.url}`);
            const popularHentai = [];
            const newHentai = [];
            const $ = this.cheerio.load(response.data);
            let containerNode = $(".index-container").first();
            for (const item of $(".gallery", containerNode).toArray()) {
                const currNode = $(item);
                // If image is undefined, we've hit a lazyload part of the website. Adjust the scraping to target the other features
                let image = $("img", currNode).attr("data-src");
                if (image == undefined)
                    image = "http:" + $("img", currNode).attr("src");
                // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
                const title = $(".caption", currNode)
                    .text()
                    .replace(/(\[.+?\])/g, "")
                    .trim();
                const idHref = $("a", currNode)
                    .attr("href")
                    .match(/\/(\d*)\//)[1];
                popularHentai.push(createMangaTile({
                    id: idHref,
                    title: createIconText({ text: title }),
                    image: image,
                }));
            }
            popular.items = popularHentai;
            sectionCallback(popular);
            containerNode = $(".index-container").last();
            for (const item of $(".gallery", containerNode).toArray()) {
                const currNode = $(item);
                // If image is undefined, we've hit a lazyload part of the website. Adjust the scraping to target the other features
                let image = $("img", currNode).attr("data-src");
                if (image == undefined)
                    image = "http:" + $("img", currNode).attr("src");
                // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
                const title = $(".caption", currNode)
                    .text()
                    .replace(/(\[.+?\])/g, "")
                    .trim();
                const idHref = $("a", currNode)
                    .attr("href")
                    .match(/\/(\d*)\//)[1];
                newHentai.push(createMangaTile({
                    id: idHref,
                    title: createIconText({ text: title }),
                    image: image,
                }));
            }
            newUploads.items = newHentai;
            sectionCallback(newUploads);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            metadata = metadata !== null && metadata !== void 0 ? metadata : { nextPage: 1 };
            if (homepageSectionId == undefined || metadata.nextPage === undefined)
                return createPagedResults({ results: [], metadata });
            // This function only works for New Uploads, no need to check the section ID
            const request = createRequestObject({
                url: `${Functions_1.NHENTAI_DOMAIN}/?page=${metadata.nextPage}`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(data.data);
            const discoveredObjects = [];
            const containerNode = $(".index-container");
            for (const item of $(".gallery", containerNode).toArray()) {
                const currNode = $(item);
                let image = $("img", currNode).attr("data-src");
                // If image is undefined, we've hit a lazyload part of the website. Adjust the scraping to target the other features
                if (image == undefined) {
                    image = "http:" + $("img", currNode).attr("src");
                }
                // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
                const title = $(".caption", currNode)
                    .text()
                    .replace(/(\[.+?\])/g, "")
                    .trim();
                const idHref = $("a", currNode)
                    .attr("href")
                    .match(/\/(\d*)\//)[1];
                discoveredObjects.push(createMangaTile({
                    id: idHref,
                    title: createIconText({ text: title }),
                    image: image,
                }));
            }
            // Do we have any additional pages? If there is an `a.last` element, we do!
            if ($("a.last"))
                metadata.nextPage = ++metadata.nextPage;
            else
                metadata.nextPage = undefined;
            return createPagedResults({
                results: discoveredObjects,
                metadata: metadata,
            });
        });
    }
    getMangaShareUrl(mangaId) {
        return "https://nhentai.net/g/" + mangaId;
    }
}
exports.NHentai = NHentai;

},{"./Functions":48,"paperback-extensions-common":5}]},{},[49])(49)
});
