import {
    Chapter,
    LanguageCode,
    Manga,
    MangaTile,
    Tag
} from 'paperback-extensions-common'
const entities = require("entities");


export class Parser {
    decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str);
    }

    parseMangaDetails($: any, mangaId: string): Manga {
        let tags: Tag[] = [];
        tags.push(createTag({
            label: 'Horror',
            id: 'Horror',
        }));
        return createManga({
            id: mangaId.split("::")[0],
            desc: this.decodeHTMLEntity($('.page-header > p').text()), //đéo sửa đc cái escape character đkm như lồn
            titles: [this.decodeHTMLEntity($('.page-title').text())],
            image: mangaId.split("::")[1],
            status: 1,
            hentai: false,
            rating: 1000,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
        });
    }

    parseChapterList($: any, mangaId: string): Chapter[] {
        const chapters: Chapter[] = [];
        var i = 0;
        for (let obj of $('.page-header > h2 > a').toArray().reverse()) {
            i++;
            chapters.push(createChapter(<Chapter>{
                id: $(obj).attr('href'),
                chapNum: i,
                name: this.decodeHTMLEntity($(obj).text()),
                mangaId: mangaId.split("::")[0],
                langCode: LanguageCode.VIETNAMESE,
            }));
        }
        return chapters;
    }

    parseChapterDetails($: any): string[] {
        const pages: string[] = [];
        for (let obj of $('p > img').toArray()) {
            let link = obj.attribs['src'];
            pages.push(link);
        }
        return pages;
    }

    parsePopularSection($: any): MangaTile[] {
        let viewestItems: MangaTile[] = [];
        for (let manga of $('li', 'ul.row').toArray().splice(0, 10)) {
            const title = $('a', manga).attr('title');
            const id = $('a', manga).attr('href');
            const image = $('a > img', manga).first().attr('src');
            if (!id || !title) continue;
            viewestItems.push(createMangaTile({
                id: id + "::" + image,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
            }));
        }
        return viewestItems;
    }

    parseSearch($: any): MangaTile[] {
        let viewestItems: MangaTile[] = [];
        for (let manga of $('li', 'ul.row').toArray()) {
            const title = $('a', manga).attr('title');
            const id = $('a', manga).attr('href');
            const image = $('a > img', manga).first().attr('src');
            if (!id || !title) continue;
            viewestItems.push(createMangaTile({
                id: id + "::" + image,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
            }));
        }
        return viewestItems;
    }

    parseViewMoreItems($: any): MangaTile[] {
        const mangas: MangaTile[] = [];
        const collectedIds: Set<string> = new Set<string>();
        for (let manga of $('li', 'ul.row').toArray()) {
            const title = $('a', manga).attr('title');
            const id = $('a', manga).attr('href');
            const image = $('a > img', manga).first().attr('src');
            if (!id || !title) continue;
            if (!collectedIds.has(id)) {
                mangas.push(createMangaTile({
                    id: id + "::" + image,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                }));
                collectedIds.add(id);
            }
        }
        return mangas;
    }
}

