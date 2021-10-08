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
    const mangas: MangaTile[] = [];
    for (let obj of $('.thumb-item-flow', '.col-12 > .card:nth-child(2) > .card-body > .row').toArray()) {
        let title = $(`.series-title > a`, obj).text().trim();
        let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
        const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
        let id = $(`.series-title > a`, obj).attr("href")?.split("/").pop() ?? title;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let obj of $('.thumb-item-flow', '.col-md-8 > .card > .card-body > .row').toArray()) {
        let title = $(`.series-title > a`, obj).text().trim();
        let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
        const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
        let id = $(`.series-title > a`, obj).attr("href")?.split("/").pop() ?? title;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: encodeURIComponent(id),
                image: image ?? "",
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }

    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("a", ".pagination_wrap").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".pagination_wrap > a.current").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
