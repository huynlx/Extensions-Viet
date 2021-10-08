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
    for (let obj of $('.entry ', '.form-row').toArray()) {
        let title = $(`a`, obj).attr('title') ?? "";
        let subtitle = $(`span.link`, obj).text().trim() !== '' ? $(`span.link`, obj).text().trim() : ($(`span.bg-info`, obj).text().trim() + ' views');
        const image = $(`a > img`, obj).attr('data-src') ?? "";
        let id = $(`a`, obj).attr("href") ?? title;
        mangas.push(createMangaTile({
            id: id,
            image,
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let obj of $('.entry ', '.form-row').toArray()) {
        let title = $(`a`, obj).attr('title') ?? "";
        let subtitle = $(`span.link`, obj).text().trim();
        const image = $(`a > img`, obj).attr('data-src') ?? "";
        let id = $(`a`, obj).attr("href") ?? title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            manga.push(createMangaTile({
                id: id,
                image: image,
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

    for (const page of $("a.page-numbers", ".z-pagination").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".z-pagination > span.current").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
