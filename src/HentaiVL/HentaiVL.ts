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
    LanguageCode
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore, capitalizeFirstLetter } from "./HentaiVLParser"

const DOMAIN = 'https://hentaivl.com/'
const method = 'GET'

export const HentaiVLInfo: SourceInfo = {
    version: '1.0.0',
    name: 'HentaiVL',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVL',
    websiteBaseURL: `https://hentaivl.com/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class HentaiVL extends Source {
    getMangaShareUrl(mangaId: string): string { return `https://hentaivl.com${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `https://hentaivl.com${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.ep-content-story').text();
        for (const t of $('.type_box > .type > a.cate-itm').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        creator = $('.info > p:nth-child(1) > span').text();
        status = $('.info > p:nth-child(4) > span').text().toLowerCase().includes("đang") ? 1 : 0;
        const image = $('.novel-thumb > img').attr('src') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.title_content > h1').text().trim()],
            image: image,
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: true,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `https://hentaivl.com${mangaId}`,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".chapter-list > li").toArray().reverse()) {
            i++;
            const getTime = $('span', obj).text().trim().split(/\//);
            const fixDate = [getTime[1], getTime[0], getTime[2]].join('/');
            const finalTime = new Date(fixDate);
            chapters.push(createChapter(<Chapter>{
                id: $('a', obj).first().attr('href'),
                chapNum: i,
                name: capitalizeFirstLetter($('a', obj).first().text().trim()),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: finalTime
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `https://hentaivl.com${chapterId}`,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('.chapter-content img').toArray()) {
            if (!obj.attribs['data-original']) continue;
            let link = obj.attribs['data-original'].trim();
            pages.push(link);
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

        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "TRUYỆN HOT",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "TRUYỆN MỚI ĐĂNG",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        //Hot
        let url = '';
        let request = createRequestObject({
            url: 'https://hentaivl.com/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.list-hot').toArray()) {
            let title = $(`.title`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.manga-thumb > a > img', obj).attr('src') ?? "";
            let id = $(`.manga-thumb > a`, obj).attr('href') ?? title;
            hotItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: capitalizeFirstLetter(subtitle),
                }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //New Updates
        url = '';
        request = createRequestObject({
            url: 'https://hentaivl.com/',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(3) > .list_wrap > .slick_item').toArray().splice(0, 20)) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.manga-thumb > a > img`, obj).attr('data-original');
            let id = $(`h3.title > a`, obj).attr('href') ?? title;
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: capitalizeFirstLetter(subtitle),
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //New Added
        url = DOMAIN
        request = createRequestObject({
            url: 'https://hentaivl.com/',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '#glo_wrapper > .section_todayup:nth-child(4) > .list_wrap > .slick_item').toArray().splice(0, 20)) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.manga-thumb > a > img`, obj).attr('data-original');
            let id = $(`h3.title > a`, obj).attr('href') ?? title;
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: capitalizeFirstLetter(subtitle),
                }),
            }))
        }
        newAdded.items = newAddItems;
        sectionCallback(newAdded);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "hot":
                url = `https://hentaivl.com/`;
                select = 0;
                break;
            case "new_updated":
                url = `https://hentaivl.com/`;
                select = 1;
                break;
            case "new_added":
                url = `https://hentaivl.com/`;
                select = 2;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method,
            param: encodeURI(`?page=${page}`)
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        let manga = parseViewMore($, select);
        metadata = undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: encodeURI(`https://hentaivl.com${tags[0] ? tags[0] : ''}`),
            method: "GET",
            param: encodeURI(`?page=${page}`)
        });

        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const url = `https://hentaivl.com/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        //the loai
        for (const tag of $('a', '#glo_gnb > ul > li:first-child > .sub-menu > li:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('href') ?? label;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://hentaivl.com/'
        }
    }
}