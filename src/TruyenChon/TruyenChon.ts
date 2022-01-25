import {
    Chapter,
    ChapterDetails, HomeSection,
    Manga,
    PagedResults,
    RequestHeaders,
    SearchRequest,
    Source,
    SourceInfo,
    TagType,
    TagSection,
    HomeSectionType,
    ContentRating,
    MangaUpdates,
    Request
} from "paperback-extensions-common"
import { Parser } from './TruyenChonParser';

const DOMAIN = 'http://truyenchon.com/'
const userAgentRandomizer = `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/78.0${Math.floor(Math.random() * 100000)}`;

export const isLastPage = ($: CheerioStatic): boolean => {
    const current = $('ul.pagination > li.active > a').text();
    let total = $('ul.pagination > li.PagerSSCCells:last-child').text();

    if (current) {
        total = total ?? '';
        return (+total) === (+current); //+ => convert value to number
    }
    return true;
}

export const TruyenChonInfo: SourceInfo = {
    version: '3.0.0',
    name: 'TruyenChon',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyenChon.',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        },
        {
            text: 'Notifications',
            type: TagType.GREEN
        },
        {
            text: 'Cloudflare',
            type: TagType.RED
        }
    ]
}

export class TruyenChon extends Source {
    parser = new Parser();
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}truyen-tranh/${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${DOMAIN}truyen-tranh/${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        return this.parser.parseMangaDetails($, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const url = `${DOMAIN}truyen-tranh/${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        return this.parser.parseChapterList($, mangaId)
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: chapterId,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const pages = this.parser.parseChapterDetails($)

        return createChapterDetails({
            pages: pages,
            longStrip: false,
            id: chapterId,
            mangaId: mangaId,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;

        const search = {
            genres: '',
            gender: "-1",
            status: "-1",
            minchapter: "1",
            sort: "0"
        };

        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const genres: string[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                genres.push(value)
            } else {
                switch (value.split(".")[0]) {
                    case 'minchapter':
                        search.minchapter = (value.split(".")[1]);
                        break
                    case 'gender':
                        search.gender = (value.split(".")[1]);
                        break
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break
                }
            }
        })
        search.genres = (genres ?? []).join(",");
        const url = `${DOMAIN}`
        const request = createRequestObject({
            url: query.title ? (url + '/the-loai') : (url + '/tim-truyen-nang-cao'),
            method: "GET",
            param: encodeURI(`?keyword=${query.title ?? ''}&genres=${search.genres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}&page=${page}`)
        });

        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = this.parser.parseSearchResults($);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        let featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let viewest: HomeSection = createHomeSection({
            id: 'viewest',
            title: "Truyện Xem Nhiều Nhất",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Hot Nhất",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện Mới Cập Nhật",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện Mới Thêm Gần Đây",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(featured);
        sectionCallback(viewest);
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        //Featured
        let url = `${DOMAIN}`
        let request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);

        featured.items = this.parser.parseFeaturedSection($);
        sectionCallback(featured);

        //View
        url = `${DOMAIN}the-loai?status=-1&sort=10`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);

        viewest.items = this.parser.parsePopularSection($);
        sectionCallback(viewest);

        //Hot
        url = `${DOMAIN}hot`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);

        hot.items = this.parser.parseHotSection($);
        sectionCallback(hot);

        //New Updates
        url = `${DOMAIN}`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);

        newUpdated.items = this.parser.parseNewUpdatedSection($);
        sectionCallback(newUpdated);

        //New added
        url = `${DOMAIN}the-loai?status=-1&sort=15`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);

        newAdded.items = this.parser.parseNewAddedSection($);
        sectionCallback(newAdded);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = "";
        let url = "";
        switch (homepageSectionId) {
            case "viewest":
                param = `?status=-1&sort=10&page=${page}`;
                url = `${DOMAIN}tim-truyen`;
                break;
            case "hot":
                param = `?page=${page}`;
                url = `${DOMAIN}hot`;
                break;
            case "new_updated":
                param = `?page=${page}`;
                url = DOMAIN;
                break;
            case "new_added":
                param = `?status=-1&sort=15&page=${page}`;
                url = `${DOMAIN}tim-truyen`;
                break;
            default:
                throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
        }

        const request = createRequestObject({
            url,
            method: 'GET',
            param,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const manga = this.parser.parseViewMoreItems($);;
        metadata = isLastPage($) ? undefined : { page: page + 1 };

        return createPagedResults({
            results: manga,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = `${DOMAIN}tim-truyen-nang-cao`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        return this.parser.parseTags($);
    }

    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        const request = createRequestObject({
            url: DOMAIN,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const returnObject = this.parser.parseUpdatedManga($, time, ids)
        mangaUpdatesFoundCallback(createMangaUpdates(returnObject))
    }

    override globalRequestHeaders(): RequestHeaders {
        return {
            referer: DOMAIN
        }
    }

    constructHeaders(headers?: any, refererPath?: string): any {
        headers = headers ?? {}
        if (userAgentRandomizer !== '') {
            headers['user-agent'] = userAgentRandomizer
        }
        headers['referer'] = `http://truyenchon.com${refererPath ?? ''}`
        return headers
    }

    override getCloudflareBypassRequest(): Request {
        return createRequestObject({
            url: `http://truyenchon.com`,
            method: 'GET',
            headers: this.constructHeaders()
        })
    }

    CloudFlareError(status: any) {
        if (status == 503) {
            throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > \<\The name of this source\> and press Cloudflare Bypass')
        }
    }

}