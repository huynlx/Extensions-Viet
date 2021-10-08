import {
    Chapter,
    LanguageCode,
    Manga,
    MangaTile,
    Tag,
    TagSection,
    MangaUpdates
} from 'paperback-extensions-common'

export class Parser {
    protected convertTime(timeAgo: string): Date {
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
                let split = timeAgo.split('/'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time
    }
    parseMangaDetails($: any, mangaId: string): Manga {
        let tags: Tag[] = [];

        for (let obj of $('li.kind > p.col-xs-8 > a').toArray()) {
            const label = $(obj).text();
            const id = $(obj).attr('href')?.split('/')[4] ?? label;
            tags.push(createTag({
                label: label,
                id: id,
            }));
        }

        const creator = $('ul.list-info > li.author > p.col-xs-8').text();
        const image = $('div.col-image > img').attr('src');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: $('div.detail-content > p').text(),
            titles: [$('h1.title-detail').text()],
            image: image ?? '',
            status: $('li.status > p.col-xs-8').text().toLowerCase().includes("hoàn thành") ? 0 : 1,
            rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
        });
    }

    parseChapterList($: any, mangaId: string): Chapter[] {
        const chapters: Chapter[] = [];
        for (let obj of $('div.list-chapter > nav > ul > li.row:not(.heading)').toArray()) {
            let time = $('div.col-xs-4', obj).text();
            let timeFinal = this.convertTime(time);
            chapters.push(createChapter(<Chapter>{
                id: $('div.chapter a', obj).attr('href'),
                chapNum: parseFloat($('div.chapter a', obj).text().split(' ')[1]),
                name: $('div.chapter a', obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: timeFinal
            }));
        }

        return chapters;
    }

    parseChapterDetails($: any): string[] {
        const pages: string[] = [];
        for (let obj of $('div.reading-detail > div.page-chapter > img').toArray()) {
            if (!obj.attribs['data-original']) continue;
            let link = obj.attribs['data-original'];
            if (link.indexOf('http') === -1) {//nếu link ko có 'http'
                pages.push('http:' + obj.attribs['data-original']);
            } else {
                pages.push(link);
            }
        }
        return pages;
    }

    parseSearchResults($: any): MangaTile[] {
        const tiles: MangaTile[] = [];

        for (const manga of $('div.item', 'div.row').toArray()) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) continue;
            tiles.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        return tiles;
    }

    parseTags($: any): TagSection[] {
        //id tag đéo đc trùng nhau
        const arrayTags: Tag[] = [];
        const arrayTags2: Tag[] = [];
        const arrayTags3: Tag[] = [];
        const arrayTags4: Tag[] = [];
        const arrayTags5: Tag[] = [];

        //The loai
        for (const tag of $('div.col-md-3.col-sm-4.col-xs-6.mrb10', 'div.col-sm-10 > div.row').toArray()) {
            const label = $('div.genre-item', tag).text().trim();
            const id = $('div.genre-item > span', tag).attr('data-id') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }
        //Số lượng chapter
        for (const tag of $('option', 'select.select-minchapter').toArray()) {
            const label = $(tag).text().trim();
            const id = 'minchapter.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags2.push({ id: id, label: label });
        }
        //Tình trạng
        for (const tag of $('option', '.select-status').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags3.push({ id: id, label: label });
        }
        //Dành cho
        for (const tag of $('option', '.select-gender').toArray()) {
            const label = $(tag).text().trim();
            const id = 'gender.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags4.push({ id: id, label: label });
        }
        //Sắp xếp theo
        for (const tag of $('option', '.select-sort').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags5.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại (Có thể chọn nhiều hơn 1)', tags: arrayTags.map(x => createTag(x)) }),
        createTagSection({ id: '1', label: 'Số Lượng Chapter (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
        createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
        createTagSection({ id: '3', label: 'Dành Cho (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
        createTagSection({ id: '4', label: 'Sắp xếp theo (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
        ];
        return tagSections;
    }

    parseFeaturedSection($: any): MangaTile[] {
        let featuredItems: MangaTile[] = [];

        for (let manga of $('div.item', 'div.altcontent1').toArray()) {
            const title = $('.slide-caption > h3 > a', manga).text();
            const id = $('a', manga).attr('href')?.split('/').pop();
            const image = $('a > img.lazyOwl', manga).attr('data-src');
            const subtitle = $('.slide-caption > a', manga).text().trim() + ' - ' + $('.slide-caption > .time', manga).text().trim();
            if (!id || !title) continue;
            featuredItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }));
        }

        return featuredItems;
    }

    parsePopularSection($: any): MangaTile[] {
        let viewestItems: MangaTile[] = [];

        for (let manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) continue;
            viewestItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }

        return viewestItems;
    }

    parseHotSection($: any): MangaTile[] {
        const TopWeek: MangaTile[] = [];
        for (const manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) continue;
            TopWeek.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }

        return TopWeek;
    }

    parseNewUpdatedSection($: any): MangaTile[] {
        let newUpdatedItems: MangaTile[] = [];
        for (let manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }

        return newUpdatedItems;
    }

    parseNewAddedSection($: any): MangaTile[] {
        let newAddedItems: MangaTile[] = [];
        for (let manga of $('div.item', 'div.row').toArray().splice(0, 20)) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) continue;
            newAddedItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }

        return newAddedItems;
    }

    parseViewMoreItems($: any): MangaTile[] {
        const mangas: MangaTile[] = [];
        const collectedIds: string[] = [];
        for (const manga of $('div.item', 'div.row').toArray()) {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) continue;
            if (!collectedIds.includes(id)) { //ko push truyện trùng nhau
                mangas.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        }
        return mangas;
    }

    // parseUpdatedManga(data: any, time: Date, ids: string[]): MangaUpdates {
    //     const returnObject: MangaUpdates = {
    //         'ids': []
    //     }
    //     const updateManga = JSON.parse(data.match(regex['latest'])?.[1])
    //     for (const elem of updateManga) {
    //         if (ids.includes(elem.IndexName) && time < new Date(elem.Date)) returnObject.ids.push(elem.IndexName)
    //     }
    //     return returnObject
    // }

}

