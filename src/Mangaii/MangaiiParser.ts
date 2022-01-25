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

export const parseSearch = (data: any): MangaTile[] => {
    const mangas: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let manga of data) {
        const title = manga.name;
        const id = 'https://mangaii.com/comic/' + manga.slug;;
        const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
        const sub = 'Chapter ' + (manga.chapter ? manga.chapter.number : '1');
        if (!id || !title) continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
}

export const parseViewMore = (data: any): MangaTile[] => {
    const mangas: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let manga of data) {
        const title = manga.name;
        const id = 'https://mangaii.com/comic/' + manga.slug;;
        const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
        const sub = 'Chapter ' + manga.chapter.number;
        if (!id || !title) continue;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
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

    for (const page of $("li.page-item", "ul.pagination").toArray()) {
        const p = Number($('a.page-link', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.page-item.active > a.page-link").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export function convertTime(timeAgo: string): Date {
    let time: Date
    let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0])
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed
    if (timeAgo.includes('giây')) {
        time = new Date(Date.now() - trimmed * 1000) // => mili giây (1000 ms = 1s)
    } else if (timeAgo.includes('phút')) {
        time = new Date(Date.now() - trimmed * 60000)
    } else if (timeAgo.includes('giờ')) {
        time = new Date(Date.now() - trimmed * 3600000)
    } else if (timeAgo.includes('ngày')) {
        time = new Date(Date.now() - trimmed * 86400000)
    } else if (timeAgo.includes('tuần')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7)
    } else if (timeAgo.includes('tháng')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4)
    } else if (timeAgo.includes('năm')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4 * 12)
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
            time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
        }
    }
    return time
}
