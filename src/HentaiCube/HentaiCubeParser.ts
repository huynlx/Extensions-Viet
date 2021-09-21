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
    const collectedIds: string[] = [];
    const mangas: MangaTile[] = [];
    for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
        let title = $(`.post-title > h3 > a`, obj).text().trim();
        let subtitle = $(`.chapter > a`, obj).text().trim();
        const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
        let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            mangas.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: (subtitle),
                }),
            }))
            collectedIds.push(id);
        }
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic, select: Number): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    if (select === 1 || select === 2 || select === 0) {
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image ?? "",
                    title: createIconText({
                        text: title ?? "",
                    }),
                    subtitleText: createIconText({
                        text: (subtitle),
                    }),
                }))
                collectedIds.push(id);
            }
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
