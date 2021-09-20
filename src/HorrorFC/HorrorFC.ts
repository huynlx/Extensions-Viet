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
    ContentRating,
    MangaTile
} from "paperback-extensions-common"
import { Parser } from './HorrorFCParser';

const DOMAIN = 'https://horrorfc.net/'

export const isLastPage = ($: CheerioStatic): boolean => {
    return true;
}

export const HorrorFCInfo: SourceInfo = {
    version: '1.0.0',
    name: 'HorrorFC',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HorrorFC.',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        },
        {
            text: "Horror",
            type: TagType.RED
        }
    ]
}

export class HorrorFC extends Source {
    parser = new Parser();
    getMangaShareUrl(mangaId: string): string { return `${mangaId.split("::")[0]}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${mangaId.split("::")[0]}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        return this.parser.parseMangaDetails($, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const url = `${mangaId.split("::")[0]}`;
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
            mangaId: mangaId.split("::")[0],
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const tiles: MangaTile[] = [];
        metadata = undefined;
        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        let viewest: HomeSection = createHomeSection({
            id: 'viewest',
            title: "Projects",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(viewest);

        ///Get the section data

        //View
        let url = `${DOMAIN}`
        let request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);

        viewest.items = this.parser.parsePopularSection($);
        sectionCallback(viewest);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = "";
        let url = "";
        switch (homepageSectionId) {
            case "viewest":
                url = DOMAIN;
                param = `?page=${page}`;
                break;
            default:
                throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
        }

        const request = createRequestObject({
            url,
            method: 'GET',
            param
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const manga = this.parser.parseViewMoreItems($);
        metadata = isLastPage($) ? undefined : { page: page + 1 };

        return createPagedResults({
            results: manga,
            metadata
        });
    }

    globalRequestHeaders(): RequestHeaders { //ko có cái này ko load đc page truyện (load ảnh)
        return {
            referer: DOMAIN
        }
    }
}