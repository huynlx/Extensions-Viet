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
    for (const element of $('div.col-6', '.form-row').toArray()) {
        let title = $('.entry > a', element).last().text().trim();
        let image = $('.entry > a > img', element).attr('src') ?? "";
        let id = $('.entry > a', element).first().attr('href') ?? title;
        let subtitle = $(`.date-time`, element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }))
    }
    return manga;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    for (const element of $('div.col-6', '.form-row').toArray()) {
        let title = $('.entry > a', element).last().text().trim();
        let image = $('.entry > a > img', element).attr('src') ?? "";
        let id = $('.entry > a', element).first().attr('href') ?? title;
        let subtitle = $(`.date-time`, element).text().trim();
        manga.push(createMangaTile({
            id: id,
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

    for (const page of $("a.page-numbers:not(:first-child):not(:last-child)", ".z-pagination").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".z-pagination > .page-numbers.current").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
