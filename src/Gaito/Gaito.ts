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

import { parseSearch, parseViewMore } from "./GaitoParser"

const method = 'GET'

export const GaitoInfo: SourceInfo = {
    version: '1.0.0',
    name: 'Gai.to',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Gai.to',
    websiteBaseURL: `https://www.gaito.me/truyen-hentai/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class Gaito extends Source {
    getMangaShareUrl(mangaId: string): string { return `https://www.gaito.me/truyen-hentai/comic/${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `https://api.gaito.me/manga/comics/${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        let tags: Tag[] = [];
        let creator = json.author;
        let status = json.status; //completed, 1 = Ongoing
        let desc = json.description;
        for (const t of json.genres) {
            const genre = t.name;
            const id = t.id;
            tags.push(createTag({ label: genre, id }));
        }
        const image = json.cover.data.dimensions.original.url;
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [json.title],
            image: image,
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: true,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `https://api.gaito.me/manga/chapters?comicId=${mangaId}&mode=by-comic&orderBy=bySortOrderDown`,
            method,
        });
        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const chapters: Chapter[] = [];
        for (const obj of json) {
            let id = obj.id;
            let chapNum = Number(obj.sortOrder);
            let name = obj.title;
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum,
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `https://api.gaito.me/manga/pages?chapterId=${chapterId}&mode=by-chapter`,
            method
        });

        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const pages: string[] = [];
        for (let obj of json) {
            let link = obj.image.dimensions.original.url;
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
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới nhất",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Thích nhất",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(view);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: 'https://api.gaito.me/manga/comics?limit=20&offset=0&sort=latest', // get JSON not HTML
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        var element: any = '';
        const check: string[] = [];
        for (element of json) {
            let title = element.title;
            let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
            let id = element.id;
            if (!check.includes(title)) {
                newUpdatedItems.push(createMangaTile({
                    id: id ?? "",
                    image: image ?? "",
                    title: createIconText({
                        text: title ?? ""
                    })
                }))
                check.push(title);
            }
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //view
        request = createRequestObject({
            url: 'https://api.gaito.me/manga/comics?limit=20&offset=0&sort=top-rated', // get JSON not HTML
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        var element: any = '';
        const check2: string[] = [];
        for (element of json) {
            let title = element.title;
            let image = element.cover ? element.cover.dimensions.thumbnail.url : null;
            let id = element.id;
            if (!check2.includes(title)) {
                newAddItems.push(createMangaTile({
                    id: id ?? "",
                    image: image ?? "",
                    title: createIconText({
                        text: title ?? ""
                    })
                }))
                check2.push(title);
            }
        }
        view.items = newAddItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 0;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://api.gaito.me/manga/comics?limit=20&offset=${page}&sort=latest`;
                select = 1;
                break;
            case "view":
                url = `https://api.gaito.me/manga/comics?limit=20&offset=${page}&sort=top-rated`;
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
        let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        let manga = parseViewMore(json, select);
        metadata = { page: page + 20 };
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 0;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: encodeURI(`https://api.gaito.me/manga/comics?genreId=${tags[0]}&limit=20&offset=${page}&sort=latest`),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const tiles = parseSearch(json)

        metadata = { page: page + 20 };

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const url = `https://api.gaito.me/ext/genres?plugin=manga`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        //the loai
        for (const tag of json) {
            const label = tag.name;
            const id = tag.id;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại Hentai', tags: tags.map(x => createTag(x)) })]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://www.gaito.me/'
        }
    }
}