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
    const collectedIds: string[] = [];
    for (let manga of $('.wrap_update .update_item').toArray()) {
        const title = $('h3.nowrap a', manga).attr('title') ?? "";
        const id = $('h3.nowrap a', manga).attr('href') ?? title;
        const image = $('a img', manga).attr('src')?.split('-');
        const ext = image?.splice(-1)[0].split('.')[1];
        const sub = $('a', manga).last().text().trim();
        mangas.push(createMangaTile(<MangaTile>{
            id: id,
            image: image?.join('-') + '.' + ext,
            title: createIconText({
                text: decodeHTMLEntity(title),
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }));
    }
    return mangas;
}

export const parseViewMore = ($: CheerioStatic, select: any): MangaTile[] => {
    const mangas: MangaTile[] = [];
    if (select === 1) {
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('a', manga).first().attr('title');
            const id = $('a', manga).first().attr('href') ?? title;
            const image = $('.update_image img', manga).attr('src')?.replace('-61x61', '');
            const sub = 'Chap' + $('a:nth-of-type(1)', manga).text().trim().split('chap')[1];
            mangas.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: decodeHTMLEntity(title ?? "") }),
                subtitleText: createIconText({ text: sub }),
            }));
        }
    } else {
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('h3.nowrap a', manga).attr('title') ?? "";
            const id = $('h3.nowrap a', manga).attr('href') ?? title;
            const image = $('a img', manga).attr('src')?.split('-');
            const ext = image?.splice(-1)[0].split('.')[1];
            const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            mangas.push(createMangaTile(<MangaTile>{
                id: id,
                image: image?.join('-') + '.' + ext,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }));
        }
    }
    return mangas;
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
    const currentPage = Number($(".wp-pagenavi .current").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export function ChangeToSlug(title: any) {
    var title, slug;

    //Đổi chữ hoa thành chữ thường
    slug = title.toLowerCase();

    //Đổi ký tự có dấu thành không dấu
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
    slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
    slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
    slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
    slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
    slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
    slug = slug.replace(/đ/gi, 'd');

    return slug
}

