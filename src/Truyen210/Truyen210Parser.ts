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
    for (const element of $('li', '.manga-list > ul').toArray()) {
        let title = $('.manga-info > h3 > a', element).text().trim();
        if (!title) continue;
        let image = $('.manga-thumb > img', element).attr('data-original') ?? "";
        let id = $('a', element).attr('href') ?? "";
        let subtitle = $(`.chapter > a`, element).text().trim();
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
    for (const element of $('li', '.manga-list > ul').toArray()) {
        let title = $('.manga-info > h3 > a', element).text().trim();
        if (!title) continue;
        let image = $('.manga-thumb > img', element).attr('data-original') ?? "";
        let id = $('a', element).attr('href') ?? "";
        let subtitle = $(`.chapter > a`, element).text().trim();
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

    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > span").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
