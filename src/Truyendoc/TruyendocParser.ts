import { Tag, MangaTile, SearchRequest, TagSection } from "paperback-extensions-common";

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
    const collectedIds: string[] = [];
    for (let manga of $('.list_comic > .left').toArray()) {
        const title = $('h2', manga).text().trim();
        const id = $('.thumbnail > a', manga).attr('href') ?? title;
        const image = $('.thumbnail img', manga).attr('src');
        const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
        if (!id || !title) continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: encodeURI(image ?? ""),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const mangas: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let manga of $('.list_comic > .left').toArray()) {
        const title = $('h2', manga).text().trim();
        const id = $('.thumbnail > a', manga).attr('href') ?? title;
        const image = $('.thumbnail img', manga).attr('src');
        const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
        if (!id || !title) continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: encodeURI(image ?? ""),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = $.html().match(/setPagiNation(.*)]]>/)?.[1].replace('(', '').split(',');
    const lastPage = Number(pages?.[0]);
    const currentPage = Number(pages?.[1]);
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}