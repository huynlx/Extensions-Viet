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

export const parseSearch = ($: CheerioStatic, query: SearchRequest, tags: string[]): MangaTile[] => {
    const manga: MangaTile[] = [];
    if (!query.title) {
        if (tags[0].includes('http')) {
            for (const element of $('li', '.detail-bxh-ul').toArray()) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = $('.image-commic-bxh img', element).attr('data-src') ?? "https://qmanga.co/image/defaul-load.png";
                let id = $('.image-commic-bxh > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                if (title === '') continue
                manga.push(createMangaTile({
                    id: id ?? "",
                    image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }))
            }
        } else {
            for (const element of $('li', '.content-tab').toArray()) {
                let title = $('.title-commic-tab', element).text().trim();
                let image = $('.image-commic-tab img', element).attr('data-src') ?? "https://qmanga.co/image/defaul-load.png";
                let id = $('.image-commic-tab > a', element).first().attr('href');
                let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
                if (title === '') continue
                manga.push(createMangaTile({
                    id: id ?? "",
                    image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }))
            }
        }
    } else {
        for (const element of $('li', '.detail-bxh-ul').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-bxh img', element).attr('data-src') ?? "";
            let id = $('.image-commic-bxh > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            if (title === '') continue
            manga.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
    }
    return manga;
}

export const parseViewMore = ($: CheerioStatic, select: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    if (select === 1) {
        for (const element of $('li', '.detail-bxh-ul').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-bxh img', element).attr('data-src') ?? "";
            let id = $('.image-commic-bxh > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            if (title === '') continue
            manga.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
    } else {
        for (const element of $('li', '.content-tab').toArray()) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-tab img', element).attr('data-src') ?? "";
            let id = $('.image-commic-tab > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            if (title === '') continue
            manga.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
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
    const currentPage = Number($("ul.pagination > li.active > span").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
