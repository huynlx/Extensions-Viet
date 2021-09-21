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
    for (let obj of $('li', '.list_wrap').toArray()) {
        let title = $(`.title`, obj).text().trim();
        let subtitle = $(`.chapter > a`, obj).text().trim();
        const image = $('.manga-thumb > a > img', obj).attr('data-original') ?? "";
        let id = $(`.manga-thumb > a`, obj).attr('href') ?? title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            mangas.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: capitalizeFirstLetter(subtitle),
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
    if (select === 0) {
        for (let obj of $('li', '.list-hot').toArray()) {
            let title = $(`.title`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.manga-thumb > a > img', obj).attr('data-original') ?? "";
            let id = $(`.manga-thumb > a`, obj).attr('href') ?? title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: capitalizeFirstLetter(subtitle),
                    }),
                }))
                collectedIds.push(id);
            }
        }
    } else if (select === 1) {
        for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(3) > .list_wrap > .slick_item').toArray()) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.manga-thumb > a > img`, obj).attr('data-original') ?? "";
            let id = $(`h3.title > a`, obj).attr('href') ?? title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: capitalizeFirstLetter(subtitle),
                    }),
                }))
                collectedIds.push(id);
            }
        }
    } else {
        for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(4) > .list_wrap > .slick_item').toArray()) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.manga-thumb > a > img`, obj).attr('data-original') ?? "";
            let id = $(`h3.title > a`, obj).attr('href') ?? title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({
                        text: title,
                    }),
                    subtitleText: createIconText({
                        text: capitalizeFirstLetter(subtitle),
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

    for (const page of $("a", "ul.pagination > li").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > a").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
