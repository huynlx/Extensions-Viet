import { MangaTile, SearchRequest } from "paperback-extensions-common";

const entities = require("entities"); //Import package for decoding HTML entities
const DOMAIN = 'https://cmangatop.com/';

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export const generateSearch = (query: SearchRequest): string => {
    let keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = (json: any, search: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    // const collectedIds: string[] = [];
    if (search.top !== '') {
        for (var i of Object.keys(json[search.top])) {
            var item = json[search.top][i];
            if (!item.name) continue;
            manga.push(createMangaTile({
                id: item.url + '-' + item.id + "::" + item.url,
                image: 'https://cmangatop.com/assets/tmp/book/avatar/' + item.avatar + '.jpg',
                title: createIconText({
                    text: titleCase(item.name),
                }),
                subtitleText: createIconText({
                    text: Number(item.total_view).toLocaleString() + ' views',
                }),
            }))
        }
    } else {
        for (var i of Object.keys(json)) {
            var item = json[i];
            if (!item.name) continue;
            manga.push(createMangaTile({
                id: item.url + '-' + item.id_book + "::" + item.url,
                image: 'https://cmangatop.com/assets/tmp/book/avatar/' + item.avatar + '.jpg',
                title: createIconText({
                    text: titleCase(item.name),
                }),
                subtitleText: createIconText({
                    text: 'Chap ' + item.last_chapter,
                }),
            }))
        }
    }

    return manga;
}

export const parseViewMore = (json: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    // const collectedIds: string[] = [];
    for (var i of Object.keys(json)) {
        var item = json[i];
        if (!item.name) continue;
        manga.push(createMangaTile({
            id: item.url + '-' + item.id_book + "::" + item.url,
            image: 'https://cmangatop.com/assets/tmp/book/avatar/' + item.avatar + '.jpg',
            title: createIconText({
                text: titleCase(item.name),
            }),
            subtitleText: createIconText({
                text: 'Chap ' + item.last_chapter,
            }),
        }))
    }
    return manga;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export function decrypt_data(data: any) {
    const CryptoJS = require('crypto-js');
    var parsed = (data);
    var type = parsed.ciphertext;
    var score = CryptoJS.enc.Hex.parse(parsed.iv);
    var lastviewmatrix = CryptoJS.enc.Hex.parse(parsed.salt);
    var adjustedLevel = CryptoJS.PBKDF2("nettruyenhayvn", lastviewmatrix, {
        "hasher": CryptoJS.algo.SHA512,
        "keySize": 64 / 8,
        "iterations": 999
    });
    var queryTokenScores = { iv: '' };
    queryTokenScores["iv"] = score;
    var pixelSizeTargetMax = CryptoJS.AES.decrypt(type, adjustedLevel, queryTokenScores);
    return pixelSizeTargetMax.toString(CryptoJS.enc.Utf8);
}

export function titleCase(str: any) {   //https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
}

export function change_alias(alias: any) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/Ă |Ă¡|áº¡|áº£|Ă£|Ă¢|áº§|áº¥|áº­|áº©|áº«|Äƒ|áº±|áº¯|áº·|áº³|áºµ/g, "a");
    str = str.replace(/Ă¨|Ă©|áº¹|áº»|áº½|Ăª|á»|áº¿|á»‡|á»ƒ|á»…/g, "e");
    str = str.replace(/Ă¬|Ă­|á»‹|á»‰|Ä©/g, "i");
    str = str.replace(/Ă²|Ă³|á»|á»|Ăµ|Ă´|á»“|á»‘|á»™|á»•|á»—|Æ¡|á»|á»›  |á»£|á»Ÿ|á»¡/g, "o");
    str = str.replace(/Ă¹|Ăº|á»¥|á»§|Å©|Æ°|á»«|á»©|á»±|á»­|á»¯/g, "u");
    str = str.replace(/á»³|Ă½|á»µ|á»·|á»¹/g, "y");
    str = str.replace(/Ä‘/g, "d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|-|$|_/g, "-");
    /* tĂ¬m vĂ  thay tháº¿ cĂ¡c kĂ­ tá»± Ä‘áº·c biá»‡t trong chuá»—i sang kĂ­ tá»± - */
    str = str.replace(/_+_/g, ""); //thay tháº¿ 2- thĂ nh 1-
    str = str.replace(/^\_+|\_+$/g, "");
    //cáº¯t bá» kĂ½ tá»± - á»Ÿ Ä‘áº§u vĂ  cuá»‘i chuá»—i 
    return str;
}