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
    HomeSectionType,
    Tag,
    LanguageCode,
    MangaTile,
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore, parseManga, change_alias } from "./VietComicParser"

const DOMAIN = 'https://vietcomic.net/'
const method = 'GET'

export const VietComicInfo: SourceInfo = {
    version: '1.0.0',
    name: 'VietComic',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from VietComic',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class VietComic extends Source {
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
        let desc = $(".manga-info-content").text().replace('NỘI DUNG :', '').trim();
        // console.log(desc);

        for (const tt of $('.manga-info-text > li').toArray()) {
            if ($(tt).text().includes('Tình Trạng')) {
                status = $(tt).text().split(":")[1].includes("Đang") ? 1 : 0;
            } else if ($(tt).text().includes('Tác Giả')) {
                creator = $(tt).text().split(":")[1].trim();
            } else if ($(tt).text().includes('Thể Loại')) {
                for (const t of $('a', tt).toArray()) {
                    const genre = $(t).text().trim()
                    const id = $(t).attr('href') ?? genre
                    tags.push(createTag({ label: genre, id }));
                }
            }
        }

        const image = $(".manga-info-pic img").first().attr('src');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc ?? "đéo có des rồi",
            titles: [$(".manga-info-text h1").first().text()],
            image: image ?? "",
            status,
            hentai: false,
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
        var el = $(".chapter-list span:nth-child(1) > a").toArray().reverse();
        const chapters: Chapter[] = [];
        var i = 0;
        for (var i = el.length - 1; i >= 0; i--) {
            var e = el[i];
            chapters.push(createChapter(<Chapter>{
                id: $(e).attr("href"),
                chapNum: i + 1,
                name: $(e).text().trim(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${chapterId}`,
            method
        });
        const regex = /data = '(.+)'/g;
        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const arr = regex.exec($.html());
        const images = arr?.[1].split('|') ?? [];
        const pages: string[] = [];
        for (var i = 0; i < images.length; i++) {
            pages.push('https://proxy.duckduckgo.com/iu/?u=' + images[i]);
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
        let az: HomeSection = createHomeSection({
            id: 'az',
            title: "A-Z",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Lượt xem",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện HOT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Siêu phẩm",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới",
            view_more: true,
        });
        //Load empty sections
        sectionCallback(az);
        sectionCallback(view);
        sectionCallback(hot);
        sectionCallback(newAdded);
        sectionCallback(newUpdated);

        ///Get the section data
        //az
        let request = createRequestObject({
            url: 'https://vietcomic.net/truyen-tranh-hay',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        az.items = parseManga($);
        sectionCallback(az);

        //View
        request = createRequestObject({
            url: 'https://vietcomic.net/truyen-tranh-hay?type=truyenhay',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        view.items = parseManga($);
        sectionCallback(view);

        //Hot
        request = createRequestObject({
            url: 'https://vietcomic.net/truyen-tranh-hay?type=hot',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        hot.items = parseManga($);
        sectionCallback(hot);

        //New Added
        request = createRequestObject({
            url: 'https://vietcomic.net/truyen-tranh-hay?type=sieu-pham',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        newAdded.items = parseManga($);
        sectionCallback(newAdded);

        //New Updates
        request = createRequestObject({
            url: 'https://vietcomic.net/truyen-tranh-hay?type=truyenmoi',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        newUpdated.items = parseManga($);
        sectionCallback(newUpdated);

        //Featured
        request = createRequestObject({
            url: 'https://vietcomic.net/',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        const featuredItems: MangaTile[] = [];
        for (const x of $('.slide .item').toArray().splice(0, 10)) {
            featuredItems.push(createMangaTile({
                id: $('.slide-caption > h3 > a', x).attr("href") ?? "",
                image: $('img', x).attr("src") ?? "",
                title: createIconText({
                    text: $('.slide-caption > h3 > a', x).text(),
                }),
                subtitleText: createIconText({
                    text: $('.slide-caption > a', x).text(),
                }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "hot":
                url = `https://vietcomic.net/truyen-tranh-hay?type=hot&page=${page}`;
                break;
            case "new_updated":
                url = `https://vietcomic.net/truyen-tranh-hay?type=truyenmoi&page=${page}`;
                break;
            case "new_added":
                url = `https://vietcomic.net/truyen-tranh-hay?type=sieu-pham&page=${page}`;
                break;
            case "az":
                url = `https://vietcomic.net/truyen-tranh-hay?type=az&page=${page}`;
                break;
            case "view":
                url = `https://vietcomic.net/truyen-tranh-hay?type=truyenhay&page=${page}`;
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
            url: query.title ? encodeURI(`https://vietcomic.net/api/searchStory/${query.title}`) :
                tags[0] + `&page=${page}`,
            method: "GET"
        });

        const data = await this.requestManager.schedule(request, 1);
        let tiles: any = [];
        if (query.title) {
            let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            // console.log(json);

            const items: MangaTile[] = [];
            for (const x of json) {
                items.push(createMangaTile({
                    id: 'https://vietcomic.net/' + change_alias(x.name ?? "") + "-" + (x.id ?? ""),
                    image: 'https://vietcomic.net' + (x.image ?? ""),
                    title: createIconText({
                        text: x.name ?? "",
                    }),
                    subtitleText: createIconText({
                        text: x.chapter_lastname ?? "",
                    }),
                }))
            }
            tiles = items;
        } else {
            let $ = this.cheerio.load(data.data);
            tiles = parseSearch($);
        }
        if (query.title) {
            metadata = undefined;
        } else {
            let $ = this.cheerio.load(data.data);
            metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        }

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = []
        const request = createRequestObject({
            url: 'https://vietcomic.net/',
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        var gen = $('.tag-name > li > a').toArray();
        for (const i of gen) {
            tags.push({
                id: $(i).attr('href') ?? "",
                label: $(i).text()
            });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: DOMAIN
        }
    }
}