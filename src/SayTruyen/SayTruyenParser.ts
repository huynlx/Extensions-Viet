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
    for (let obj of $('li', 'ul#danhsachtruyen').toArray()) {
        let title = $(`.info-bottom > a`, obj).text().trim();
        let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
        var image = $('a', obj).first().attr('data-src');
        let id = $(`.info-bottom > a`, obj).attr("href") ?? title;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: image?.includes('http') ? image : (image?.includes('//') ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let obj of $('li', 'ul#danhsachtruyen').toArray()) {
        let title = $(`.info-bottom > a`, obj).text().trim();
        let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
        var image = $('a', obj).first().attr('data-src');
        let id = $(`.info-bottom > a`, obj).attr("href") ?? title;
        if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
            manga.push(createMangaTile({
                id: encodeURIComponent(id),
                image: image?.includes('http') ? image : (image?.includes('//') ? ('https:' + image.replace('//st.truyenchon.com', '//st.imageinstant.net')) : ('https://saytruyen.net/' + image)),
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

    for (const page of $("a", "ul.pager > li").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pager > li.active > a").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
