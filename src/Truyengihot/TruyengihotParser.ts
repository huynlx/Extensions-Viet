import { MangaTile, SearchRequest } from "paperback-extensions-common";

const entities = require("entities"); //Import package for decoding HTML entities

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const generateSearch = (query: SearchRequest): string => {
    let keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    var allItem = $('ul.cw-list li').toArray();
    for (var i in allItem) {
        var item = allItem[i];
        let title = $('.title a', item).text();
        let image = $('.thumb', item).attr('style')?.split(/['']/)[1] ?? "";
        if (!image.includes('http')) image = 'https://truyengihot.net/' + image;
        let id = 'https://truyengihot.net' + $('.title a', item).attr('href');
        let subtitle = $('.chapter-link', item).last().text();
        manga.push(createMangaTile({
            id: id ?? "",
            image: encodeURI(decodeHTMLEntity(image)),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
        }))
    }
    return manga;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    var allItem = $('ul.cw-list li').toArray();
    for (var i in allItem) {
        var item = allItem[i];
        let title = $('.title a', item).text();
        let image = $('.thumb', item).attr('style')?.split(/['']/)[1] ?? "";
        if (!image.includes('http')) image = 'https://truyengihot.net/' + image;
        let id = 'https://truyengihot.net' + $('.title a', item).attr('href');
        let subtitle = $('.chapter-link', item).last().text();
        manga.push(createMangaTile({
            id: id ?? "",
            image: encodeURI(decodeHTMLEntity(image)),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
        }))
    }
    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li > a.current").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
