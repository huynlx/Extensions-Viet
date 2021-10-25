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

import { parseSearch, isLastPage, parseViewMore, convertTime } from "./MangaiiParser"

const DOMAIN = 'https://mangaii.com/'
const method = 'GET'

export const MangaiiInfo: SourceInfo = {
    version: '1.0.0',
    name: 'Mangaii',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Mangaii',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Mangaii extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: mangaId,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]).props.pageProps.comic;
        let tags: Tag[] = [];
        let status = (dt.status === 'ongoing') ? 1 : 0;
        let desc = !dt.description ? $('#description').text() : dt.description;
        for (const t of dt.genres) {
            const genre = t.name;
            const id = `https://mangaii.com/genre/${t.slug}`
            tags.push(createTag({ label: genre, id }));
        }
        const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${dt.cover_image}&w=256&q=100`;
        const creator = '';

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [dt.name],
            image: image,
            status,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: mangaId,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]).props.pageProps.comic;
        const chapters: Chapter[] = [];
        for (const obj of dt.chapters) {
            chapters.push(createChapter(<Chapter>{
                id: `https://mangaii.com/comic/${dt.slug}/${obj.slug}`,
                chapNum: obj.number,
                name: obj.name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: convertTime(obj.created_at)
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
        for (let obj of $('._1-mrs > img').toArray()) {
            let link = $(obj).attr('src');
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
        let featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "# Hot là đây!",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "# Mới cập nhập!",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Bảng xếp hạng",
            view_more: false,
        });
        let news: HomeSection = createHomeSection({
            id: 'new',
            title: "# Mới ra mắt",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);
        sectionCallback(news);

        ///Get the section data
        //Get json data
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]).props.pageProps.comics;

        // Hot
        let popularItems: MangaTile[] = [];
        for (let manga of dt.translate) {
            const title = manga.name;
            const id = 'https://mangaii.com/comic/' + manga.slug;
            const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
            const sub = 'Chapter ' + manga.chapter.number;
            popularItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        hot.items = popularItems;
        sectionCallback(hot);

        // featured
        let featuredItems: MangaTile[] = [];
        for (let manga of dt.banners) {
            const title = manga.name;
            if (title === 'Mangaii') continue;
            const id = manga.link;
            const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fslider-banner%2F${encodeURI(manga.image)}&w=768&q=75`;
            // const sub = 'Chapter ' + manga.chapter.number;
            featuredItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                // subtitleText: createIconText({
                //     text: sub,
                // }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //New Updates
        let newUpdatedItems: MangaTile[] = [];
        for (let manga of dt.laste_comics) {
            const title = manga.name;
            const id = 'https://mangaii.com/comic/' + manga.slug;
            const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
            const sub = 'Chapter ' + manga.chapter.number;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image,
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

        //view
        let newAddItems: MangaTile[] = [];
        for (let manga of dt.top_views) {
            const title = manga.name;
            const id = 'https://mangaii.com/comic/' + manga.slug;
            const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
            const sub = manga.total_views.toLocaleString() + ' views';
            newAddItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        view.items = newAddItems;
        sectionCallback(view);

        //new
        let newsItems: MangaTile[] = [];
        for (let manga of dt.new_comics) {
            const title = manga.name;
            const id = 'https://mangaii.com/comic/' + manga.slug;
            const image = `https://mangaii.com/_next/image?url=https%3A%2F%2Fapi.mangaii.com%2Fmedia%2Fcover_images%2F${manga.cover_image}&w=256&q=100`;
            const sub = 'Chapter ' + manga.chapter.number;
            newsItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        news.items = newsItems;
        sectionCallback(news);


    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://api.mangaii.com/api/v1/comics?page=${page}`;
                break;
            case "new_added":
                url = `https://truyentranh.net/comic-latest?page=${page}`;
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
        const json = JSON.parse(response.data);

        const manga = parseViewMore(json.data);
        metadata = json.hasMore ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: query.title ? encodeURI(`https://api.mangaii.com/api/v1/search?name=${query.title}&page=${page}`) : `https://api.mangaii.com/api/v1/comics?page=${page}&genre=${tags[0]}`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const json = JSON.parse(data.data);
        const tiles = parseSearch(json.data);

        metadata = json.hasMore ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = 'https://mangaii.com/_next/data/fM7pdjCUFacEnYx_vhENt/vi/genre/all-qWerTy12.json?slug=all-qWerTy12'
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const json = JSON.parse(response.data).pageProps.genres;
        const arrayTags: Tag[] = [];
        //the loai
        for (const tag of json) {
            arrayTags.push({ id: tag.slug, label: tag.name });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: `${DOMAIN}`
        }
    }
}