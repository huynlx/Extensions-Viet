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
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, isLastPage, parseViewMore } from "./TruyendocParser"

const DOMAIN = 'http://truyendoc.info/'
const method = 'GET'

export const TruyendocInfo: SourceInfo = {
    version: '1.0.1',
    name: 'Truyendoc',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyendoc',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Truyendoc extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
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
        const request = createRequestObject({
            url: encodeURI(mangaId),
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let status = 1;
        let desc = $('#PlaceHolderLeft_mP_Description').text();
        for (const t of $('#PlaceHolderLeft_mP_Kind a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href')?.trim() ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        const image = $('.manga-cover img').attr('src') ?? "fuck";
        const creator = $('#PlaceHolderLeft_mA_Actor').text().trim();

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [$('#PlaceHolderLeft_mH1_TitleComic').text()],
            image: (image),
            status,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: encodeURI(mangaId),
            method,
        });
        var i = 0;
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        for (const obj of $(".list_chapter a").toArray().reverse()) {
            i++;
            var chapNum = parseFloat($(obj).text().split(' ').pop());
            chapters.push(createChapter(<Chapter>{
                id: 'http://truyendoc.info' + $(obj).attr('href'),
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: $(obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: encodeURI(chapterId),
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('#ContentPlaceDetail_mDivMain > img').toArray()) {
            let link = obj.attribs['data-original'].trim();
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
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Hot",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện Tranh Mới Nhất",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện Tranh Full",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(newAdded);
        sectionCallback(hot);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: 'http://truyendoc.info/tinh-nang/truyen-moi-nhat',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('.list_comic > .left').toArray()) {
            const title = $('h2', manga).text().trim();
            const id = $('.thumbnail > a', manga).attr('href') ?? title;
            const image = $('.thumbnail img', manga).attr('src');
            const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
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

        //New Added
        request = createRequestObject({
            url: 'http://truyendoc.info/truyen-du-bo',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.list_comic > .left').toArray()) {
            const title = $('h2', manga).text().trim();
            const id = $('.thumbnail > a', manga).attr('href') ?? title;
            const image = $('.thumbnail img', manga).attr('src');
            const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        newAdded.items = newAddItems;
        sectionCallback(newAdded);

        // Hot
        request = createRequestObject({
            url: 'http://truyendoc.info/truyen-xem-nhieu',
            method: "GET",
        });
        let popular: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.list_comic > .left').toArray()) {
            const title = $('h2', manga).text().trim();
            const id = $('.thumbnail > a', manga).attr('href') ?? title;
            const image = $('.thumbnail img', manga).attr('src');
            const sub = 'Chap ' + $('.comic_content > span:nth-of-type(3) > font:first-child', manga).text().trim();
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: encodeURI(image),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `http://truyendoc.info/tinh-nang/truyen-moi-nhat/${page}`;
                break;
            case "new_added":
                url = `http://truyendoc.info/truyen-du-bo/trang-${page}`;
                break;
            case "hot":
                url = `http://truyendoc.info/truyen-xem-nhieu/${page}`;
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
        const $ = this.cheerio.load(response.data);

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
            url: query.title ? encodeURI(`http://truyendoc.info/tinh-nang/tim-kiem/${query.title}/${page}`) : `${tags[0]}/${page}`,
            method: "GET",
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
        const url = DOMAIN
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        const collectedIds: string[] = [];
        //the loai
        for (const tag of $('.ul_submenu a').toArray()) {
            arrayTags.push({ id: $(tag).attr('href'), label: $(tag).text().trim() });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}