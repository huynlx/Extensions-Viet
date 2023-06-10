import { test } from "mocha"
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
    HomeSectionType,
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage } from "./Truyentranh24Parser"

const DOMAIN = 'https://truyennhanh1.com/'
const method = 'GET'

export const Truyentranh24Info: SourceInfo = {
    version: '1.5.1',
    name: 'Truyentranh1',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyentranh1',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Truyentranh24 extends Source {
    getMangaShareUrl(mangaId: string): string { return (DOMAIN + mangaId.split("::")[0]) };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': DOMAIN
                    }
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = DOMAIN + mangaId;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        // let tags: Tag[] = [];
        let creator = '';
        let statusFinal = 1;
        creator = $('.manga-author > span').text().trim();
        let dataId = $('.container').attr('data-id');
        // for (const t of $('a', test).toArray()) {
        //     const genre = $(t).text().trim();
        //     const id = $(t).attr('href') ?? genre;
        //     tags.push(createTag({ label: genre, id }));
        // }
        let status = $('.manga-status > span').text().trim(); //completed, 1 = Ongoing
        statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;

        let desc = $(".manga-content").text();
        const image = $('.manga-thumbnail > img').attr("data-src") ?? "";
        return createManga({
            id: mangaId + "::" + dataId, //=> id là mangaId mới
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.manga-title').text().trim()],
            image: image.includes('http') ? image : (DOMAIN + image),
            status: statusFinal,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            // tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: 'https://truyennhanh1.com/api/mangas/' + mangaId.split("::")[1] + '/chapters?offset=0&limit=0',
            method,
            headers: {
                'x-requested-with': 'XMLHttpRequest',
                'referer': 'https://truyennhanh1.com'
            }
        });
        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const chapters: Chapter[] = [];
        for (const obj of json.chapters) {
            let chapNum = obj.slug.split('-')[1];
            let name = obj.views.toLocaleString() + ' lượt đọc';
            let time = obj.created_at.split(' ');
            let d = time[0].split('-');
            let t = time[1].split(':');
            chapters.push(createChapter(<Chapter>{
                id: DOMAIN + mangaId.split("::")[0] + '/' + obj.slug, //chapterId
                chapNum: Number(chapNum),
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(d[1] + '/' + d[2] + '/' + d[0] + ' ' + t[0] + ':' + t[1])
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${chapterId}`,
            method
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const pages: string[] = [];
        for (let obj of $('.chapter-content img').toArray()) {
            let link = $(obj).attr('data-src') ?? "";
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
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "HOT TRONG NGÀY",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "CHAP MỚI NHẤT",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "ĐỌC NHIỀU NHẤT",
            view_more: true,
        });
        let add: HomeSection = createHomeSection({
            id: 'add',
            title: "TRUYỆN MỚI",
            view_more: false,
        });
        let top: HomeSection = createHomeSection({
            id: 'top',
            title: "TOP TUẦN",
            view_more: false,
        });
        let miss: HomeSection = createHomeSection({
            id: 'miss',
            title: "ĐỪNG BỎ LỠ",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(featured);
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);
        sectionCallback(add);
        sectionCallback(top);
        sectionCallback(miss);

        ///Get the section data
        // featured
        let request = createRequestObject({
            url: 'https://truyennhanh1.com/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (const element of $('.container-lm > section:nth-child(2) > .item-big').toArray()) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = $('a', element).first().attr('href').split('/')[1] ?? title;
            let subtitle = $(".item-description", element).text().trim();
            // if (!id || !title) continue;
            featuredItems.push(createMangaTile(<MangaTile>{
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        // Hot
        request = createRequestObject({
            url: 'https://truyennhanh1.com/top-ngay',
            method: "GET",
        });
        let popular: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray().splice(0, 12)) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = $('a', element).first().attr('href').split('/')[1] ?? title;
            let subtitle = $("span.background-8", element).text().trim();
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        //New Updates
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
            let title = $('.item-title > a', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = $('.item-title > a', element).attr('href').split('/')[1] ?? title;
            let subtitle = $("span.background-1", element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //view
        request = createRequestObject({
            url: 'https://truyennhanh1.com/truyen-hot',
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray().splice(0, 12)) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = $('a', element).first().attr('href').split('/')[1] ?? title;
            let subtitle = $("span.background-8", element).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);

        //add
        request = createRequestObject({
            url: 'https://truyennhanh1.com/',
            method: "GET",
        });
        let addItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.container-lm > section:nth-child(3) > .new > .item-large').toArray()) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = $('a', element).first().attr('href').split('/')[1] ?? title;
            let subtitle = $(".item-children > a:first-child > .child-name", element).text().trim() + ' | ' + $(".item-children > a:first-child > .child-update", element).text().trim();
            addItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        add.items = addItems;
        sectionCallback(add);

        //top
        request = createRequestObject({
            url: 'https://truyennhanh1.com/',
            method: "GET",
        });
        let topItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.container-lm > section:nth-child(3) > .column-right > .item-large').toArray()) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-poster > img', element).attr("data-src");
            let id = $('a', element).first().attr('href').split('/')[1] ?? title;
            let subtitle = $(".background-9", element).text().trim();
            topItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        top.items = topItems;
        sectionCallback(top);

        //miss
        request = createRequestObject({
            url: 'https://truyennhanh1.com/',
            method: "GET",
        });
        let missItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.container-lm > section:nth-child(4) > .item-medium').toArray()) {
            let title = $('.item-title', element).text().trim();
            let image = $('.item-thumbnail > img', element).attr("data-src");
            let id = $('a', element).first().attr('href').split('/')[1] ?? title;
            let subtitle = $(".background-3", element).text().trim();
            missItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        miss.items = missItems;
        sectionCallback(miss);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "hot":
                url = `https://truyennhanh1.com/top-ngay?p=${page}`;
                select = 1;
                break;
            case "new_updated":
                url = `https://truyennhanh1.com/chap-moi-nhat`;
                select = 2;
                break;
            case "view":
                url = `https://truyennhanh1.com/truyen-hot?p=${page}`;
                select = 1;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
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
            url: query.title ? encodeURI(`hhttps://truyennhanh1.com/tim-kiem/${query.title}?p=${page}`) : (`https://truyennhanh1.com/` + tags[0] + `?p=${page}`),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [
            {
                id: "/danh-sach",
                label: "Danh sách"
            }
        ];
        const url = DOMAIN;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.navbar-item-sub a').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('href');
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}
