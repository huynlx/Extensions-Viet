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

import { parseSearch, parseViewMore, isLastPage } from "./Truyen210Parser"

const method = 'GET'

export const Truyen210Info: SourceInfo = {
    version: '1.0.1',
    name: 'Truyen210',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyen210',
    websiteBaseURL: `https://truyen210.net/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class Truyen210 extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': 'https://truyen210.net/'
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
        const url = `${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = $('.col-full > .mt-author > ul > li > a').text().trim();
        let status = $('.col-full > .meta-data:nth-child(4)').text().trim(); //completed, 1 = Ongoing
        let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        let desc = $("#showless").text().trim() !== '' ? $("#showless").text().trim() : $('.summary-content > p:nth-child(3)').text().trim();
        for (const t of $('.col-full > .meta-data:nth-child(6) > a').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        const image = $('.manga-thumb > img').attr('data-original') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc.replace(/ +(?= )/g, '').replace(/\n/g, ''), //regex quá đỉnh
            titles: [$('.headline > h1').text().trim()],
            image: image,
            status: statusFinal,
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
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $('#chapters-list-content li:not(:first-child)').toArray().reverse()) {
            i++;
            let id = $('span:nth-child(1) > a', obj).attr('href');
            let chapNum = Number($('span:nth-child(1) > a', obj).text().trim().split(' ')[1]);
            let name = $('span:nth-child(1) > a', obj).text().trim();
            let time = $('.time', obj).text().trim().split('-');
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: isNaN(chapNum) ? i : chapNum,
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(time[1] + '/' + time[0] + '/' + time[2])
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
        for (let obj of $('.box-chapter-content > img').toArray()) {
            let link = $(obj).attr('src') ?? "";
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
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện mới nhất",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Truyện đang hot",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(view);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: 'https://truyen210.net/danh-sach-truyen',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        const check: string[] = [];
        for (const element of $('li', '.manga-list').toArray().splice(0, 20)) {
            let title = $('.manga-info > h3 > a', element).text().trim();
            let image = $('.manga-thumb > img', element).attr('data-original') ?? "";
            let id = $('a', element).attr('href');
            let subtitle = $(`.chapter > a`, element).text().trim();
            if (!check.includes(title)) {
                newUpdatedItems.push(createMangaTile({
                    id: id ?? "",
                    image: image ?? "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }))
                check.push(title);
            }
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //hot
        request = createRequestObject({
            url: 'https://truyen210.net/dang-hot',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        const check2: string[] = [];
        for (const element of $('li', '.manga-list').toArray().splice(0, 20)) {
            let title = $('.manga-info > h3 > a', element).text().trim();
            let image = $('.manga-thumb > img', element).attr('data-original') ?? "";
            let id = $('a', element).attr('href');
            let subtitle = $(`.chapter > a`, element).text().trim();
            if (!check2.includes(title)) {
                newAddItems.push(createMangaTile({
                    id: id ?? "",
                    image: image ?? "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }))
                check2.push(title);
            }
        }
        view.items = newAddItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://truyen210.net/danh-sach-truyen?page=${page}`;
                select = 1;
                break;
            case "view":
                url = `https://truyen210.net/dang-hot?page=${page}`;
                select = 2;
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
        let manga = parseViewMore($);
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
            url: query.title ? encodeURI(`https://truyen210.net/tim-kiem?q=${query.title}&page=${page}`) : (`${tags[0]}?page=${page}`),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($)

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const url = `https://truyen210.net/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.manga-box-cat-content > a').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('href');
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })]
        return tagSections;
    }
}