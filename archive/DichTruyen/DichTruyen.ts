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
    HomeSectionType
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage } from "./DichTruyenParser"

const DOMAIN = 'https://dichtruyen.org/'
const method = 'GET'

export const DichTruyenInfo: SourceInfo = {
    version: '1.0.0',
    name: 'DichTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from DichTruyen',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class DichTruyen extends Source {
    getMangaShareUrl(mangaId: string): string { return (DOMAIN + mangaId.split("::")[0]) };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
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
            url: 'https://truyentranh24.com/api/mangas/' + mangaId.split("::")[1] + '/chapters?offset=0&limit=0',
            method,
            headers: {
                'x-requested-with': 'XMLHttpRequest',
                'referer': 'https://truyentranh24.com'
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


        //Load empty sections
        // sectionCallback(featured);
        // sectionCallback(hot);
        sectionCallback(newUpdated);
        // sectionCallback(view);
        // sectionCallback(add);
        // sectionCallback(top);
        // sectionCallback(miss);

        ///Get the section data
        // featured
        let request = createRequestObject({
            url: 'https://truyentranh24.com',
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
        // sectionCallback(featured);

        // Hot
        request = createRequestObject({
            url: 'https://truyentranh24.com/top-ngay',
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
        // sectionCallback(hot);

        //New Updates
        request = createRequestObject({
            url: 'https://dichtruyen.org/truyen/21118-tinh-yeu-cua-co-nang-lap-di-mizuki-senpai/c655617-chap-8',
            method: "GET",
            param: '?t=1634565699',
            headers: {
                "authority": "dichtruyen.org",
                "pragma": "no-cache",
                "cache-control": "no-cache",
                "sec-ch-ua": '"Chromium";v="94", "Microsoft Edge";v="94", ";Not A Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "Windows",
                "upgrade-insecure-requests": "1",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 Edg/94.0.992.50",
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "sec-fetch-site": "none",
                "sec-fetch-mode": "navigate",
                "sec-fetch-user": "?1",
                "sec-fetch-dest": "document",
                "accept-language": "en-GB,en;q=0.9,en-US;q=0.8,fr;q=0.7,vi;q=0.6",
                "cookie": "dtplscr2821=dt2821; _ga=GA1.2.988603676.1632834169; PHPSESSID=nuni07oev9o6rcfe1v4jcfofc7; dtplscr1121=dt1121; dtplscr1321=dt1321; dtplscr1421=dt1421; dtplscr1521=dt1521; dtplscr1621=dt1621; dtplscr1821=dt1821; _gid=GA1.2.506699400.1634556735; _gat_gtag_UA_201178538_1=1"
            }
        });
        data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString();
        $ = this.cheerio.load(html);

        // let newUpdatedItems: MangaTile[] = [];
        // for (const element of $('.container-lm > section:nth-child(1) > .item-medium').toArray()) {
        //     let title = $('.item-title > a', element).text().trim();
        //     let image = $('.item-thumbnail > img', element).attr("data-src");
        //     let id = $('.item-title > a', element).attr('href').split('/')[1] ?? title;
        //     let subtitle = $("span.background-1", element).text().trim();
        //     newUpdatedItems.push(createMangaTile({
        //         id: id ?? "",
        //         image: image ?? "",
        //         title: createIconText({ text: title }),
        //         subtitleText: createIconText({ text: subtitle }),
        //     }))
        // }
        // newUpdated.items = newUpdatedItems;
        // sectionCallback(newUpdated);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "hot":
                url = `https://truyentranh24.com/top-ngay?p=${page}`;
                select = 1;
                break;
            case "new_updated":
                url = `https://truyentranh24.com/chap-moi-nhat`;
                select = 2;
                break;
            case "view":
                url = `https://truyentranh24.com/truyen-hot?p=${page}`;
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
            url: query.title ? encodeURI(`https://truyentranh24.com/tim-kiem/${query.title}?p=${page}`) : (`https://truyentranh24.com/` + tags[0] + `?p=${page}`),
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

    override globalRequestHeaders(): RequestHeaders {
        return {
            referer: DOMAIN
        }
    }

}