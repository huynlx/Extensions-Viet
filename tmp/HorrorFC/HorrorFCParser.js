"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const entities = require("entities");
class Parser {
    decodeHTMLEntity(str) {
        return entities.decodeHTML(str);
    }
    parseMangaDetails($, mangaId) {
        let tags = [];
        tags.push(createTag({
            label: 'Horror',
            id: 'Horror',
        }));
        return createManga({
            id: mangaId.split("::")[0],
            desc: this.decodeHTMLEntity($('.page-header > p').text()),
            titles: [this.decodeHTMLEntity($('.page-title').text())],
            image: mangaId.split("::")[1],
            status: 1,
            hentai: false,
            rating: 1000,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
        });
    }
    parseChapterList($, mangaId) {
        const chapters = [];
        var i = 0;
        for (let obj of $('.page-header > h2 > a').toArray().reverse()) {
            i++;
            chapters.push(createChapter({
                id: $(obj).attr('href'),
                chapNum: i,
                name: this.decodeHTMLEntity($(obj).text()),
                mangaId: mangaId.split("::")[0],
                langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
            }));
        }
        return chapters;
    }
    parseChapterDetails($) {
        const pages = [];
        for (let obj of $('p > img').toArray()) {
            let link = obj.attribs['src'];
            pages.push(link);
        }
        return pages;
    }
    parsePopularSection($) {
        let viewestItems = [];
        for (let manga of $('li', 'ul.row').toArray().splice(0, 10)) {
            const title = $('a', manga).attr('title');
            const id = $('a', manga).attr('href');
            const image = $('a > img', manga).first().attr('src');
            if (!id || !title)
                continue;
            viewestItems.push(createMangaTile({
                id: id + "::" + image,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
            }));
        }
        return viewestItems;
    }
    parseSearch($) {
        let viewestItems = [];
        for (let manga of $('li', 'ul.row').toArray()) {
            const title = $('a', manga).attr('title');
            const id = $('a', manga).attr('href');
            const image = $('a > img', manga).first().attr('src');
            if (!id || !title)
                continue;
            viewestItems.push(createMangaTile({
                id: id + "::" + image,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
            }));
        }
        return viewestItems;
    }
    parseViewMoreItems($) {
        const mangas = [];
        const collectedIds = new Set();
        for (let manga of $('li', 'ul.row').toArray()) {
            const title = $('a', manga).attr('title');
            const id = $('a', manga).attr('href');
            const image = $('a > img', manga).first().attr('src');
            if (!id || !title)
                continue;
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
exports.Parser = Parser;
