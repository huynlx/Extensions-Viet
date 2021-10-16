import { Tag, MangaTile, SearchRequest, TagSection } from "paperback-extensions-common";

// const entities = require("entities"); //Import package for decoding HTML entities

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export const generateSearch = (query: SearchRequest): string => {
    let keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = ($: CheerioStatic, query: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    // const collectedIds: string[] = [];
    var loop = [];
    if (query.title) {
        loop = $('div.py-2', '.row').toArray();
    } else {
        loop = $('div.py-2', '.col-md-8 .row').toArray();
    }
    for (let obj of loop) {
        const title = $('a', obj).last().text().trim();
        const id = $('a', obj).last().attr('href') ?? title;
        const image = $('div', obj).first().css('background');
        const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        const sub = $('a', obj).first().text().trim();
        // if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: 'https://lxhentai.com' + id,
            image: 'https://lxhentai.com' + bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }))
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    // const collectedIds: string[] = [];
    for (let obj of $('div.col-md-3', '.main .col-md-8 > .row').toArray()) {
        const title = $('a', obj).last().text().trim();
        const id = $('a', obj).last().attr('href') ?? title;
        const image = $('div', obj).first().css('background');
        const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        const sub = $('a', obj).first().text().trim();
        // if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: 'https://lxhentai.com' + id,
            image: 'https://lxhentai.com' + bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }))
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
}

export const parseTags = ($: CheerioStatic): TagSection[] => {
    const arrayTags: Tag[] = [];
    for (const obj of $("li", "ul").toArray()) {
        const label = ($("a", obj).text().trim());
        const id = $('a', obj).attr('href') ?? "";
        if (id == "") continue;
        arrayTags.push({
            id: id,
            label: label,
        });
    }
    const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) })];
    return tagSections;
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
    const currentPage = Number($("li.active > a").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

// const decodeHTMLEntity = (str: string): string => {
//     return entities.decodeHTML(str);
// }
