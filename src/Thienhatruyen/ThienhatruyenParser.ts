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
    for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray()) {
        let title = $(`.detail > h3 > a`, obj).text().trim();
        let subtitle = $(`.chapters a`, obj).attr('title');
        const image = $(`.cover img`, obj).attr('data-src');
        let id = $(`.detail > h3 > a`, obj).attr("href")?.split("/").pop() ?? title;
        if (!id || !subtitle) continue;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: image ?? "",
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray()) {
        let title = $(`.detail > h3 > a`, obj).text().trim();
        let subtitle = $(`.chapters a`, obj).attr('title');
        const image = $(`.cover img`, obj).attr('data-src');
        let id = $(`.detail > h3 > a`, obj).attr("href")?.split("/").pop() ?? title;
        if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: encodeURIComponent(id),
            image: image ?? "",
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
        collectedIds.push(id);
    }

    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("a", ".paging > ul > li").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".paging > ul > li > a.active").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
