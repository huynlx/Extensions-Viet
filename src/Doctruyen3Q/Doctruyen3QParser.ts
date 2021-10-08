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
    for (const element of $('.content-search-left > .main-left .item-manga > .item').toArray()) {
        let title = $('.caption > h3 > a', element).text().trim();
        let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
        let id = $('.caption > h3 > a', element).attr('href') ?? title;
        let subtitle = $("ul > li:first-child > a", element).text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: img ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }))
    }
    return manga;
}

export const parseViewMore = ($: CheerioStatic, homepageSectionId: string): MangaTile[] => {
    const manga: MangaTile[] = [];
    if (homepageSectionId === 'hot') {
        for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
    } else if (homepageSectionId === 'new_updated') {
        for (const element of $('#home > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
    } else if (homepageSectionId === 'boy') {
        for (const element of $('#male-comics > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
    } else {
        for (const element of $('#female-comics > .body > .main-left .item-manga > .item').toArray()) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            manga.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
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
    const currentPage = Number($("ul.pagination > li.active").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
