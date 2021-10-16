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
    for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
        let title = $('.item-title', element).text().trim();
        let image = $('.item-thumbnail > img', element).attr("data-src");
        let id = $('a', element).first().attr('href')?.split('/')[1] ?? title;
        let subtitle = $("span.background-8", element).text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: image ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }))
    }
    return manga;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
        let title = $('.item-title', element).text().trim();
        let image = $('.item-thumbnail > img', element).attr("data-src");
        let id = $('a', element).first().attr('href')?.split('/')[1] ?? title;
        let subtitle = $("span.background-8", element).text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: image ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }))
    }
    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a.page-link', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > span.page-link").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
