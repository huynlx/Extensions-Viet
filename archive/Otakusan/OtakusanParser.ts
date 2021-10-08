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
    for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
        let title = $('.series-title > a', element).text().trim();
        let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
        if (!image?.includes('http')) {
            image = 'https://manhuarock.net' + image;
        } else {
            image = image;
        }
        let id = $('.series-title > a', element).attr('href') ?? title;
        let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
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
    for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
        let title = $('.series-title > a', element).text().trim();
        let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
        if (!image?.includes('http')) {
            image = 'https://manhuarock.net' + image;
        } else {
            image = image;
        }
        let id = $('.series-title > a', element).attr('href') ?? title;
        let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
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
    const currentPage = Number($("ul.pagination > li > a.active").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
