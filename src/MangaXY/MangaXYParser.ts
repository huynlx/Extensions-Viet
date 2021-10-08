import { MangaTile, SearchRequest } from "paperback-extensions-common";

const entities = require("entities"); //Import package for decoding HTML entities

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export const generateSearch = (query: SearchRequest): string => {
    let keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
    var element = $(".thumb").toArray();
    const mangas: MangaTile[] = [];
    for (var el in element) { // in => index, of => element
        var book = element[el]
        var checkCover = $("img", book).attr("style")
        var cover = '';
        if (checkCover?.indexOf('jpg') != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = checkCover?.match(/image: url\('\/\/(.+)\'\)/)?.[1] ?? "" //regex
        else
            cover = ""
        mangas.push(createMangaTile({
            id: $("a.name", book).attr("href") ?? "",
            image: "https://" + cover,
            title: createIconText({
                text: $("a.name", book).text().replace("T MỚI ", "").trim(),
            }),
            subtitleText: createIconText({
                text: $("a.chap", book).text().replace("C MỚI ", "").trim(),
            }),
            badge: 10,
            primaryText: createIconText({
                text: 'huynh',
            }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    var element = $(".thumb").toArray();
    const mangas: MangaTile[] = [];
    for (var el in element) { // in => index, of => element
        var book = element[el]
        var checkCover = $("img", book).attr("style")
        var cover = '';
        if (checkCover?.indexOf('jpg') != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = checkCover?.match(/image: url\('\/\/(.+)\'\)/)?.[1] ?? "" //regex
        else
            cover = ""
        mangas.push(createMangaTile({
            id: $("a.name", book).attr("href") ?? "",
            image: "https://" + cover,
            title: createIconText({
                text: $("a.name", book).text().replace("T MỚI ", "").trim(),
            }),
            subtitleText: createIconText({
                text: $("a.chap", book).text().replace("C MỚI ", "").trim(),
            }),
            badge: 10,
            primaryText: createIconText({
                text: 'huynh',
            }),
        }));
    }
    return mangas;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export const parseManga = ($: CheerioStatic): MangaTile[] => {
    var element = $(".thumb").toArray().splice(0, 20);
    const mangas: MangaTile[] = [];
    for (var el in element) { // in => index, of => element
        var book = element[el]
        var checkCover = $("img", book).attr("style")
        var cover = '';
        if (checkCover?.indexOf('jpg') != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = checkCover?.match(/image: url\('\/\/(.+)\'\)/)?.[1] ?? "" //regex
        else
            cover = ""
        mangas.push(createMangaTile({
            id: $("a.name", book).attr("href") ?? "",
            image: "https://" + cover,
            title: createIconText({
                text: $("a.name", book).text().replace("T MỚI ", "").trim(),
            }),
            subtitleText: createIconText({
                text: $("a.chap", book).text().replace("C MỚI ", "").trim(),
            }),
            badge: 10,
            primaryText: createIconText({
                text: 'huynh',
            }),
        }));
    }
    return mangas;
}

export function ucFirstAllWords(str: any) {
    var pieces = str.split(" ");
    for (var i = 0; i < pieces.length; i++) {
        var j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    }
    return pieces.join(" ");
}