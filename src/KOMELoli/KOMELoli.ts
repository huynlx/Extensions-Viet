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
import { parseSearch, isLastPage, parseViewMore } from "./KOMELoliParser"

const DOMAIN = 'https://hentaicube.net/'
const method = 'GET'

export const KOMELoliInfo: SourceInfo = {
    version: '2.5.0',
    name: 'KOMELoli',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from KOMELoli',
    websiteBaseURL: `https://komeloli.net/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class KOMELoli extends Source {
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
        let desc = $('.description-summary > .summary__content').text();
        for (const t of $('.post-content > div:nth-child(8) > .summary-content a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        creator = $('.info > p:nth-child(1) > span').text();
        status = $('.post-status > div:nth-child(2) > .summary-content').text().trim().toLowerCase().includes("đang") ? 1 : 0;
        const image = $('.tab-summary img').attr('data-src')?.replace('-193x278', '') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.post-title > h1').text().trim()],
            image: image,
            status,
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
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".listing-chapters_wrap li").toArray().reverse()) {
            i++;
            // const getTime = $('span', obj).text().trim().split(/\//);
            // const fixDate = [getTime[1], getTime[0], getTime[2]].join('/');
            // const finalTime = new Date(fixDate);
            chapters.push(createChapter(<Chapter>{
                id: $('a', obj).first().attr('href'),
                chapNum: i,
                name: ($('a', obj).first().text().trim()),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                // time: finalTime
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
        for (let obj of $('.text-left img').toArray()) {
            if (!obj.attribs['data-src']) continue;
            let link = obj.attribs['data-src'].trim();
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
            title: "Gợi ý hôm nay",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Hot tháng",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới cập nhật",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Xem nhiều nhất",
            view_more: true,
        });
        let newest: HomeSection = createHomeSection({
            id: 'new',
            title: "New",
            view_more: true,
        });


        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);
        sectionCallback(newest);

        ///Get the section data
        //Featured
        let url = ``
        let request = createRequestObject({
            url: 'https://komeloli.net/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('.thumb-item-flow ', '#main-content > .wrap-content-part:nth-child(1) .row.cuutruyen').toArray()) {
            let title = $(`.series-title a`, obj).text().trim();
            let subtitle = $(`.chapter-title`, obj).text().trim();
            const image = $('.a6-ratio img', obj).attr('data-src') ?? "";
            let id = $(`.series-title a`, obj).attr('href') ?? title;
            featuredItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: (subtitle),
                }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //Hot
        url = '';
        request = createRequestObject({
            url: 'https://hentaicube.net/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.popular-item-wrap', '#manga-recent-3 .widget-content').toArray()) {
            let title = $(`.popular-content a`, obj).text().trim();
            // let subtitle = $(`.chapter > a`, obj).text();
            const image = $(`.popular-img > a > img`, obj).attr('data-src')?.replace('-75x106', '');
            let id = $(`.popular-img > a`, obj).attr('href') ?? title;
            // if (!id || !subtitle) continue;
            hotItems.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({
                    text: title,
                }),
                // subtitleText: createIconText({
                //     text: capitalizeFirstLetter(subtitle),
                // }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //New Updates
        url = '';
        request = createRequestObject({
            url: 'https://hentaicube.net/?s&post_type=wp-manga&m_orderby=latest',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? "",
                }),
                subtitleText: createIconText({
                    text: subtitle
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //view
        url = DOMAIN
        request = createRequestObject({
            url: 'https://hentaicube.net/?s&post_type=wp-manga&m_orderby=views',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            newAddItems.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: (subtitle),
                }),
            }))
        }
        view.items = newAddItems;
        sectionCallback(view);

        //Newest
        url = '';
        request = createRequestObject({
            url: 'https://hentaicube.net/?s&post_type=wp-manga&m_orderby=new-manga',
            method: "GET",
        });
        let newItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? "";
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            newItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? "",
                }),
                subtitleText: createIconText({
                    text: subtitle
                }),
            }))
        }
        newest.items = newItems;
        sectionCallback(newest);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new":
                url = `https://hentaicube.net/page/${page}/?s&post_type=wp-manga&m_orderby=new-manga`;
                select = 0;
                break;
            case "new_updated":
                url = `https://hentaicube.net/page/${page}/?s&post_type=wp-manga&m_orderby=latest`;
                select = 1;
                break;
            case "view":
                url = `https://hentaicube.net/page/${page}/?s&post_type=wp-manga&m_orderby=views`;
                select = 2;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
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
        var status: any[] = [];
        var genre: any[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                genre.push(value);
            } else {
                switch (value.split(".")[0]) {
                    case 'status':
                        status.push(value.split(".")[1]);
                        break
                }
            }
        })
        var statusFinal = '';
        var genresFinal = '';
        const convertStatus = (status: any[]) => {///status=['canceled','on-going'] => status=canceled&status=on-going
            let y = [];
            for (const e of status) {
                let x = 'status=' + e;
                y.push(x);
            }
            statusFinal = (y ?? []).join("&");
            return statusFinal;
        }
        const convertGenres = (genre: any[]) => {///genre=['ahegao','anal'] => genre=ahegao&genre=anal
            let y = [];
            for (const e of genre) {
                let x = 'genre=' + e;
                y.push(x);
            }
            genresFinal = (y ?? []).join("&");
            return genresFinal;
        }
        const request = createRequestObject({
            url: encodeURI(`https://hentaicube.net/page/${page}/?s=${query.title ?? ""}&post_type=wp-manga&${convertGenres(genre)}&op=&author=&artist=&release=&adult=&${convertStatus(status)}`),
            method: "GET"
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
        const tags: Tag[] = [];
        const tags2: Tag[] = [];
        const url = `https://hentaicube.net/?s=&post_type=wp-manga`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        //the loai
        for (const tag of $('.checkbox', '.checkbox-group').toArray()) {
            const label = $('label', tag).text().trim();
            const id = $('input', tag).attr('id') ?? label;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }

        //tinh trang
        for (const tag of $('.checkbox-inline', '.search-advanced-form > .form-group:nth-child(9) ').toArray()) {
            const label = $('label', tag).text().trim();
            const id = 'status.' + $('input', tag).attr('value') ?? label;
            if (!id || !label) continue;
            tags2.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        createTagSection({ id: '1', label: 'Tình Trạng', tags: tags2.map(x => createTag(x)) })]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://komeloli.net/'
        }
    }
}