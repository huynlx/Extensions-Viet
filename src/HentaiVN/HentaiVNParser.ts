import { Chapter, ChapterDetails, Tag, HomeSection, LanguageCode, Manga, MangaTile, SearchRequest, TagSection } from "paperback-extensions-common";
import { HentaiVN } from "./HentaiVN";
const entities = require("entities"); //Import package for decoding HTML entities

export const parseMangaDetails = ($: any, mangaId: string): Manga => {
    let tags: Tag[] = [];
    let creator = '';
    let status = 1; //completed, 1 = Ongoing
    let desc = '';
    for (const obj of $('p', '.page-info').toArray()) {
        switch ($('span.info:first-child', obj).text().trim()) {
            case "Thể Loại:":
                for (const genres of $('span:not(.info)', obj).toArray()) {
                    const genre = $('a', genres).text().trim()
                    const id = $('a', genres).attr('href') ?? genre
                    tags.push(createTag({ id: id, label: genre }));
                }
                break;
            case "Tác giả:":
                creator = $('span:nth-child(2) > a', obj).text();
                break;
            case "Tình Trạng:":
                status = $('span:nth-child(2) > a', obj).text().toLowerCase().includes("đã hoàn thành") ? 0 : 1;
                break;
            case "Nội dung:":
                desc = desc = $(obj).next().text();
                break;
        }
    }
    return createManga({
        id: mangaId.split("::")[0],
        author: creator,
        artist: creator,
        desc: desc === "" ? 'Không có mô tả' : desc,
        titles: [$('.page-info > h1').text().trim()],
        image: encodeURI(mangaId.split("::")[1].replace('190', '300').trim()),
        status,
        hentai: true,
        tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
    });
}

export const parseChapters = ($: any, mangaId: string): Chapter[] => {
    const chapters: Chapter[] = [];
    var i = 0;
    for (const obj of $(".listing tr").toArray().reverse()) {
        i++;
        const name = ($("td:first-child > a > h2", obj).text().trim());
        const id = $('td:first-child > a', obj).attr('href').split('/').pop() ?? "";
        const time = $("td:last-child", obj).text().trim().split(/\//);
        const finalTime = new Date([time[1], time[0], time[2]].join('/'));
        if (id == "") continue;
        const chapterNumber = i;
        chapters.push(createChapter(<Chapter>{
            id: encodeURIComponent(id),
            chapNum: chapterNumber,
            name,
            mangaId: mangaId.split("::")[0],
            langCode: LanguageCode.VIETNAMESE,
            time: finalTime
        }));
    }
    return chapters;
}

export const parseChapterDetails = ($: any, mangaId: string, chapterId: string): ChapterDetails => {
    const pages: string[] = [];
    for (let obj of $('div#image > img').toArray()) {
        if (!obj.attribs['src']) continue;
        let link = obj.attribs['src'];
        pages.push(link);
    }

    const chapterDetails = createChapterDetails({
        id: chapterId,
        mangaId: mangaId.split("::")[0],
        pages: pages,
        longStrip: false
    });

    return chapterDetails;
}

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export const parseHomeSections = ($: CheerioStatic, sections: HomeSection[], sectionCallback: (section: HomeSection) => void): void => {
    for (const section of sections) sectionCallback(section);

    //featured
    let featured: MangaTile[] = [];
    for (let manga of $('li', '.block-top').toArray()) {
        const title = $('.box-description h2', manga).first().text();
        const id = $('a', manga).attr('href')?.split('/').pop();
        const image = $('a > div', manga).css('background');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        const subtitle = $(".info-detail", manga).last().text().trim();
        if (!id || !title) continue;
        featured.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + bg,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[0].items = featured;
    sectionCallback(sections[0]);


    //Recently Updated
    let staffPick: MangaTile[] = [];
    for (let manga of $('ul', 'ul.page-item').toArray()) {
        const title = $('span > a > h2', manga).first().text();
        const id = $('a', manga).attr('href')?.split('/').pop();
        const image = $('a > div', manga).css('background');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        const subtitle = $("a > span > b", manga).last().text().trim();
        if (!id || !title) continue;
        staffPick.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + bg,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[2].items = staffPick;
    sectionCallback(sections[2]);
}

export const parseRandomSections = ($: CheerioStatic, sections: HomeSection[], sectionCallback: (section: HomeSection) => void): void => {
    //Random
    let random: MangaTile[] = [];
    for (let manga of $('li', '.page-random').toArray()) {
        const title = $('.des-same > a > b', manga).text();
        const id = $('.img-same > a', manga).attr('href')?.split('/').pop();
        const image = $('.img-same > a > div', manga).css('background');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        const subtitle = $("b", manga).last().text().trim();
        if (!id || !title) continue;
        random.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + bg,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[1].items = random;
    sectionCallback(sections[1]);
}

export const parseAddedSections = ($: CheerioStatic, sections: HomeSection[], sectionCallback: (section: HomeSection) => void): void => {
    //Recently Added
    let added: MangaTile[] = [];
    for (let manga of $('.item', '.block-item').toArray()) {
        const title = $('.box-description > p > a', manga).text();
        const id = $('.box-cover > a', manga).attr('href')?.split('/').pop();
        const image = $('.box-cover > a > img', manga).attr('data-src');
        const subtitle = $(".box-description p:nth-child(1)", manga).text().trim();
        const fixsub = subtitle.split('-')[1];
        if (!id || !title) continue;
        added.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + image,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: fixsub.trim() }),
        }));
    }
    sections[4].items = added;
    sectionCallback(sections[4]);
}

export const parsePopularSections = ($: CheerioStatic, sections: HomeSection[], sectionCallback: (section: HomeSection) => void): void => {
    //popular
    let popular: MangaTile[] = [];
    for (let manga of $('.item', '.block-item').toArray()) {
        const title = $('.box-description > p > a', manga).text();
        const id = $('.box-cover > a', manga).attr('href')?.split('/').pop();
        const image = $('.box-cover > a > img', manga).attr('data-src');
        const subtitle = $(".box-description p:nth-child(1)", manga).text().trim();
        const fixsub = subtitle.split('-')[1];
        if (!id || !title) continue;
        popular.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + image,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: fixsub.trim() }),
        }));
    }
    sections[3].items = popular;
    sectionCallback(sections[3]);
}

export const generateSearch = (query: SearchRequest): string => {
    let keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
    const mangas: MangaTile[] = [];
    for (let manga of $('.item', '.block-item').toArray()) {
        const title = $('.box-description > p > a', manga).text();
        const id = $('.box-cover > a', manga).attr('href')?.split('/').pop();
        const image = $('.box-cover > a > img', manga).attr('data-src');
        const subtitle = $(".box-description p:nth-child(1)", manga).text().trim();
        const fixsub = subtitle.split('-')[1];
        if (!id || !title) continue;
        mangas.push(createMangaTile({
            id: encodeURIComponent(id) + "::" + image,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.trim()),
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: fixsub.trim() }),
        }));
    }

    return mangas;
}

export const parseViewMore = ($: CheerioStatic, select: number): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];
    if (select === 1) {
        for (const obj of $(".item", "ul").toArray()) {
            const title = $("span > a > h2", obj).text();
            const id = $("a", obj).attr('href')?.split('/').pop();
            const image = $("a > img", obj).attr('data-src');
            const subtitle = $("a > span > b", obj).text().trim();
            if (!id || !title) continue;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id: encodeURIComponent(id) + "::" + image,
                    image: image ?? "",
                    title: createIconText({ text: decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        }
    } else {
        for (let obj of $('.item', '.block-item').toArray()) {
            const title = $('.box-description > p > a', obj).text();
            const id = $('.box-cover > a', obj).attr('href')?.split('/').pop();
            const image = $('.box-cover > a > img', obj).attr('data-src');
            const subtitle = $(".box-description p:nth-child(1)", obj).text().trim();
            const fixsub = subtitle.split('-')[1];
            if (!id || !title) continue;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id: encodeURIComponent(id) + "::" + image,
                    image: image ?? "",
                    title: createIconText({ text: decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: fixsub.trim() }),
                }));
            }
            collectedIds.push(id);
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
    const currentPage = Number($("li > b").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}
