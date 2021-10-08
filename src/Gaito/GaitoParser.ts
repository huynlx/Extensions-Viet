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

export const parseSearch = (json: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    var element: any = '';
    for (element of json) {
        let title = element.title;
        let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
        let id = element.id;
        if (!collectedIds.includes(title)) {
            manga.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? ""
                })
            }))
            collectedIds.push(title);
        }
    }
    return manga;
}

export const parseViewMore = (json: any, select: Number): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    var element: any = '';
    for (element of json) {
        let title = element.title;
        let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
        let id = element.id;
        if (!collectedIds.includes(title)) {
            manga.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? ""
                })
            }))
            collectedIds.push(title);
        }
    }
    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("a", ".wp-pagenavi").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($(".wp-pagenavi > span.current").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
