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

export const parseSearch = (json: any): MangaTile[] => {
    const mangas: MangaTile[] = [];
    const array = json.result.data ?? json.result;
    for (let obj of array) {
        let title = obj.name;
        let subtitle = 'Chương ' + obj.chapterLatest[0];
        const image = obj.photo;
        let id = 'https://goctruyentranh.com/truyen/' + obj.nameEn + "::" + obj.id;
        mangas.push(createMangaTile({
            id: id,
            image: encodeURI(image) ?? "",
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
}

export const parseViewMore = (json: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (let obj of json.result.data) {
        let title = obj.name;
        let subtitle = 'Chương ' + obj.chapterLatest[0];
        const image = obj.photo;
        let id = 'https://goctruyentranh.com/truyen/' + obj.nameEn + "::" + obj.id;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id: id,
                image: encodeURI(image) ?? "",
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }

    return manga;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export function convertTime(timeAgo: string): Date {
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
    } else if (timeAgo.includes('tuần')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7)
    } else if (timeAgo.includes('tháng')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4)
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
            let split = timeAgo.split('-'); //vd => 05/12/18
            time = new Date(split[1] + '/' + split[0] + '/' + split[2]);
        }
    }
    return time
}