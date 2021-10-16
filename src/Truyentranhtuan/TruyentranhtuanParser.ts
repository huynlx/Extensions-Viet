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
    for (const element of $('#new-chapter .manga-focus').toArray()) {
        let title = $('.manga > a', element).text().trim();
        let id = $('.manga > a', element).attr('href') ?? title;
        let subtitle = $('.chapter > a', element).text().trim();
        let img = '';
        manga.push(createMangaTile({
            id: id ?? "",
            image: encodeURI(img ?? ""),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }))
    }
    return manga;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    for (const element of $('#new-chapter .manga-update').toArray()) {
        let title = $('a', element).first().text().trim();
        let img = $('img', element).attr('src')?.replace('-80x90', '');
        let id = $('a', element).attr('href') ?? title;
        let subtitle = $('a', element).last().text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: encodeURI(img ?? ""),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }))
    }
    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("li", "#page-nav").toArray()) {
        const p = Number($('span', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("#page-nav li.current-page").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
