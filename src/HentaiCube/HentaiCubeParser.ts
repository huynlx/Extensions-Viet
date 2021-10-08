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

export const parseSearch = ($: CheerioStatic, set: any): MangaTile[] => {
    const collectedIds: string[] = [];
    const mangas: MangaTile[] = [];
    if (set === 1) {
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                mangas.push(createMangaTile({
                    id: id,
                    image: encodeURI(image),
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
    } else {
        for (let obj of $('.page-listing-item > .row > .col-12', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                mangas.push(createMangaTile({
                    id: id,
                    image: encodeURI(image.replace('-110x150', '')),
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
                    image: encodeURI(image),
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

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export const convertTime = (timeAgo: string): Date => {
    let time: Date
    let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0])
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed
    if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
        time = new Date(Date.now() - trimmed * 1000) // => mili giây (1000 ms = 1s)
    } else if (timeAgo.includes('phút')) {
        time = new Date(Date.now() - trimmed * 60000)
    } else if (timeAgo.includes('giờ')) {
        time = new Date(Date.now() - trimmed * 3600000)
    } else if (timeAgo.includes('ngày')) {
        time = new Date(Date.now() - trimmed * 86400000)
    } else if (timeAgo.includes('năm')) {
        time = new Date(Date.now() - trimmed * 31556952000)
    } else {
        if (timeAgo.includes(":")) {
            let split = timeAgo.split(' ');
            let H = split[0]; //vd => 21:08
            let D = split[1]; //vd => 25/08 
            let fixD = D.split('/');
            let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
            time = new Date(finalD + ' ' + H);
        } else {
            let split = timeAgo.split('/'); //vd => 05/12/18
            time = new Date(split[1] + '/' + split[0] + '/' + split[2]);
        }
    }
    return time
}