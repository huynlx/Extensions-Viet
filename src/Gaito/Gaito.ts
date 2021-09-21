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

import axios from 'axios';

import { parseSearch, isLastPage, parseViewMore, capitalizeFirstLetter } from "./GaitoParser"

const DOMAIN = 'https://www.gaito.me/truyen-hentai/'
const method = 'GET'

export const GaitoInfo: SourceInfo = {
    version: '1.0.0',
    name: 'Gaito',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Gaito',
    websiteBaseURL: `https://www.gaito.me/truyen-hentai/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        },
        {
            text: "Error",
            type: TagType.RED
        }
    ]
}

export class Gaito extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.description-summary > .summary__content').text();
        for (const t of $('.post-content > div:nth-child(8) > .summary-content a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        creator = $('.info > p:nth-child(1) > span').text();
        status = $('.post-status > div:nth-child(2) > .summary-content').text().trim().toLowerCase().includes("đang") ? 1 : 0;
        const image = $('.tab-summary img').attr('data-src')?.replace('-193x278', '') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.post-title > h1').text().trim()],
            image: image,
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: true,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${mangaId}`,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".listing-chapters_wrap li").toArray().reverse()) {
            i++;
            // const getTime = $('span', obj).text().trim().split(/\//);
            // const fixDate = [getTime[1], getTime[0], getTime[2]].join('/');
            // const finalTime = new Date(fixDate);
            chapters.push(createChapter(<Chapter>{
                id: $('a', obj).first().attr('href'),
                chapNum: i,
                name: ($('a', obj).first().text().trim()),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                // time: finalTime
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${chapterId}`,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('.text-left img').toArray()) {
            if (!obj.attribs['data-src']) continue;
            let link = obj.attribs['data-src'].trim();
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
        let featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Gợi ý hôm nay",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Hot tháng",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Top view ngày",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);

        ///Get the section data
        //Featured
        let url = ``
        let request = createRequestObject({
            url: 'https://hentaicube.net/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('.item__wrap ', '.slider__container .slider__item').toArray()) {
            let title = $(`.slider__content .post-title`, obj).text().trim();
            let subtitle = $(`.slider__content .chapter-item a`, obj).text().trim();
            const image = $('.slider__thumb a > img', obj).attr('data-src')?.replace('-110x150', '') ?? "";
            let id = $(`.slider__thumb a`, obj).attr('href') ?? title;
            featuredItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: (subtitle),
                }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //Hot
        url = '';
        request = createRequestObject({
            url: 'https://hentaicube.net/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.popular-item-wrap', '#manga-recent-3 .widget-content').toArray()) {
            let title = $(`.popular-content a`, obj).text().trim();
            // let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.popular-img > a > img`, obj).attr('data-src')?.replace('-75x106', '');
            let id = $(`.popular-img > a`, obj).attr('href') ?? title;
            // if (!id || !subtitle) continue;
            hotItems.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({
                    text: title,
                }),
                // subtitleText: createIconText({
                //     text: capitalizeFirstLetter(subtitle),
                // }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //New Updates
        request = createRequestObject({
            url: 'https://api.gaito.me/manga/comics?limit=20&offset=0&sort=latest', // get JSON not HTML
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        let array = data.data;
        var element: any = '';
        for (element of array) {
            let title = element.title;
            let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
            let id = element.id;
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? ""
                })
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //view
        url = DOMAIN
        request = createRequestObject({
            url: 'https://hentaicube.net/',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('div.popular-item-wrap', '#manga-recent-2 .widget-content').toArray()) {
            let title = $(`.popular-content a`, obj).text().trim();
            // let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.popular-img > a > img`, obj).attr('data-src')?.replace('-75x106', '');
            let id = $(`.popular-img > a`, obj).attr('href') ?? title;
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({
                    text: title,
                }),
                // subtitleText: createIconText({
                //     text: (subtitle),
                // }),
            }))
        }
        view.items = newAddItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "hot":
                url = `https://hentaicube.net/page/${page}/`;
                select = 0;
                break;
            case "new_updated":
                url = `https://hentaicube.net/page/${page}/`;
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
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        let manga = parseViewMore($, select);
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
        const url = `https://hentaicube.net/the-loai-genres/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        //the loai
        for (const tag of $('a', '.ctcleft').toArray()) {
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
            referer: 'https://www.gaito.me/'
        }
    }
}