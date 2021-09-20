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
    for (let manga of $('li', '.list-stories').toArray()) {
        let title = $(`h3.title-book > a`, manga).text().trim();
        let subtitle = $(`.episode-book > a`, manga).text().trim();
        let image = $(`a > img`, manga).attr("src") ?? "";
        let id = $(`a`, manga).attr("href")?.split("/").pop() ?? title;
        if (!id || !title) continue;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id),
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let obj of $('.thumb-item-flow', '.col-md-8 > .card:nth-child(2) .row-last-update').toArray()) {
        const title = $('.series-title', obj).text().trim();
        const id = $('.series-title > a', obj).attr('href');
        const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', obj).attr('data-bg');
        const sub = $('.chapter-title  > a', obj).text().trim()
        if (!id || !title) continue;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: id,
                image: image?.includes('http') ? (image) : ("https:" + image),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: "Chương " + sub,
                }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
}

// export const parseTags = ($: CheerioStatic): TagSection[] => {
//     const arrayTags: Tag[] = [];
//     for (const obj of $("li", "ul").toArray()) {
//         const label = ($("a", obj).text().trim());
//         const id = $('a', obj).attr('href') ?? "";
//         if (id == "") continue;
//         arrayTags.push({
//             id: id,
//             label: label,
//         });
//     }
//     const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) })];
//     return tagSections;
// }

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("li > a.active").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
