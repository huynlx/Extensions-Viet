import {
    Chapter,
    ChapterDetails, HomeSection,
    Manga,
    PagedResults,
    Request,
    Response,
    SearchRequest,
    Source,
    SourceInfo,
    TagType,
    ContentRating,
    MangaTile,
    TagSection,
    Tag
} from "paperback-extensions-common"
import { Parser } from './HorrorFCParser';

const DOMAIN = 'https://horrorfc.com/'

export const isLastPage = ($: CheerioStatic): boolean => {
    return true;
}

export const HorrorFCInfo: SourceInfo = {
    version: '1.0.1',
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
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        var tiles: any = [];
        if (query.title) {
            tiles = []
        } else {
            const request = createRequestObject({
                url: encodeURI(tags[0]),
                method: "GET"
            });
            const data = await this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            tiles = this.parser.parseSearch($);
        }
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
            view_more: false,
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

    async getSearchTags(): Promise<TagSection[]> {
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let count = $('a.item > span:nth-child(2)').text().trim();
        const tags: Tag[] = [{ 'id': 'https://horrorfc.com/', 'label': 'Tất Cả (' + count + ')' }];
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })]
        return tagSections;
    }
}