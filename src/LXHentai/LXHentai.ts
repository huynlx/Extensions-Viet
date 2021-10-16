import {
    Source,
    Manga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    SourceInfo,
    TagType,
    TagSection,
    ContentRating,
    RequestHeaders,
    MangaTile,
    Tag,
    LanguageCode,
    HomeSectionType
} from "paperback-extensions-common"

// import axios from "axios";
import { parseSearch, isLastPage, parseViewMore } from "./LXHentaiParser"

const DOMAIN = 'https://lxhentai.com/'
const method = 'GET'

export const LXHentaiInfo: SourceInfo = {
    version: '2.0.0',
    name: 'LXHentai',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from LXHentai',
    websiteBaseURL: `https://lxhentai.com/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class LXHentai extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${mangaId}`,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 10);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let artist = '';
        let desc = $('.detail-content > p').text();
        for (const a of $('.row.mt-2 > .col-4.py-1').toArray()) {
            switch ($(a).text().trim()) {
                case "Tác giả":
                    creator = $(a).next().text();
                    break;
                case "Tình trạng":
                    status = $(a).next().text().toLowerCase().includes("đã") ? 0 : 1;
                    break;
                case "Thể loại":
                    for (const t of $('a', $(a).next()).toArray()) {
                        const genre = $(t).text().trim()
                        const id = $(t).attr('href') ?? genre
                        tags.push(createTag({ label: genre, id }));
                    }
                    break;
                case "Thực hiện":
                    artist = $(a).next().text();
                    break;
            }
        }
        return createManga({
            id: mangaId,
            author: creator,
            artist: artist,
            desc: desc,
            titles: [$('h1.title-detail').text()],
            image: 'https://lxhentai.com' + $('.col-md-8 > .row > .col-md-4 > img').attr('src'),
            status: status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: true,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: mangaId,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $("#listChuong > ul > .row:not(:first-child) > div.col-5").toArray().reverse()) {
            i++;
            let time = $($(obj).next()).text().trim().split(' ');
            let day = time[1].split('/');
            let h = time[0];
            chapters.push(createChapter(<Chapter>{
                id: 'https://lxhentai.com' + $('a', obj).attr('href'),
                chapNum: i,
                name: $('a', obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(day[1] + '/' + day[0] + '/' + day[2] + ' ' + h)
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: chapterId,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        const list = $('#content_chap p img').toArray().length === 0 ? $('#content_chap div:not(.text-center) img').toArray()
            : $('#content_chap p img').toArray();
        for (let obj of list) {
            let link = obj.attribs['src'].includes('http') ? obj.attribs['src'] : 'https:' + obj.attribs['src'];
            pages.push(encodeURI(link));
        }

        const chapterDetails = createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
            longStrip: false
        });
        return chapterDetails;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        let featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới cập nhật",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Hot nhất",
            view_more: true,
        });
        sectionCallback(newUpdated);
        sectionCallback(hot);
        //New Updates
        let request = createRequestObject({
            url: 'https://lxhentai.com/story/index.php',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray().splice(0, 15)) {
            const title = $('a', manga).last().text().trim();
            const id = $('a', manga).last().attr('href') ?? title;
            const image = $('div', manga).first().css('background');
            const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('a', manga).first().text().trim();
            newUpdatedItems.push(createMangaTile({
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
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //Hot
        request = createRequestObject({
            url: 'https://lxhentai.com/story/index.php?hot',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        html = Buffer.from(createByteArray(data.rawData)).toString()
        $ = this.cheerio.load(html);
        for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray().splice(0, 15)) {
            const title = $('a', manga).last().text().trim();
            const id = $('a', manga).last().attr('href') ?? title;
            const image = $('div', manga).first().css('background');
            const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('a', manga).first().text().trim();
            hotItems.push(createMangaTile({
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
        hot.items = hotItems;
        sectionCallback(hot);

        //Featured
        request = createRequestObject({
            url: 'https://lxhentai.com/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        html = Buffer.from(createByteArray(data.rawData)).toString()
        $ = this.cheerio.load(html);
        for (let manga of $('.truyenHot .gridSlide > div').toArray()) {
            const title = $('.slideName > a', manga).text().trim();
            const id = $('.slideName > a', manga).attr('href') ?? title;
            const image = $('.itemSlide', manga).first().css('background');
            const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('.newestChapter', manga).text().trim();
            featuredItems.push(createMangaTile({
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
        featured.items = featuredItems;
        sectionCallback(featured);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "hot":
                url = `https://lxhentai.com/story/index.php?hot&p=${page}`;
                break;
            case "new_updated":
                url = `https://lxhentai.com/story/index.php?p=${page}`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method,
            param
        });

        const response = await this.requestManager.schedule(request, 1);
        const html = Buffer.from(createByteArray(response.rawData)).toString()
        const $ = this.cheerio.load(html);

        const manga = parseViewMore($);
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: query.title ? `https://lxhentai.com/story/search.php?key=${encodeURI(query.title)}&p=${page}` : `${tags[0]}&p=${page}`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        const tiles = parseSearch($, query);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = `https://lxhentai.com/#`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        //the loai
        for (const tag of $('.col-6 a', '#theloaiMob').toArray()) {
            const label = $(tag).text().trim();
            const id = 'https://lxhentai.com/' + $(tag).attr('href') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh trong page thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://lxhentai.com/'
        }
    }
}