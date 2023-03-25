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
    Request,
    Response,
    MangaTile,
    Tag,
    LanguageCode,
    HomeSectionType
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore, convertTime, decodeHTMLEntity } from "./HentaiCubeParser"

const DOMAIN = 'https://hencb.top/'
const method = 'GET'

export const HentaiCubeInfo: SourceInfo = {
    version: '2.7.1',
    name: 'HentaiCube',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiCube',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class HentaiCube extends Source {
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
        let desc = '';
        $('.description-summary > .summary__content ul li').toArray().map((item: any) => {
            desc += '●  ' + $(item).text() + '\n';
        })

        for (const test of $('.post-content_item', '.post-content').toArray()) {
            switch ($('.summary-heading > h5', test).text().trim()) {
                case 'Tác giả':
                    creator = $('.author-content', test).text();
                    break;
                case 'Thể loại':
                    for (const t of $('.genres-content > a', test).toArray()) {
                        const genre = $(t).text().trim()
                        const id = $(t).attr('href') ?? genre
                        tags.push(createTag({ label: genre, id }));
                    }
                    break;
                case 'Tình trạng':
                    status = $('.summary-content', test).text().trim().toLowerCase().includes("đang") ? 1 : 0;
                    break;
                default:
                    break;
            }
        }
        const image = $('.tab-summary img').attr('src')?.replace('-193x278', '') ?? "";

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: decodeHTMLEntity(desc),
            titles: [decodeHTMLEntity($('.post-title > h1').text().trim())],
            image: encodeURI(image),
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
            const getTime = $('span', obj).text().trim();
            let timeFinal = convertTime(getTime);
            chapters.push(createChapter(<Chapter>{
                id: $('a', obj).first().attr('href'),
                chapNum: i,
                name: ($('a', obj).first().text().trim()),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: timeFinal
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
        let link;
        for (let obj of $('.text-left > div > img').toArray()) {
            if (!obj.attribs['data-src']) {
                link = obj.attribs['src'].trim();
            } else {
                link = obj.attribs['data-src'].trim();
            };
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
            title: "Gợi ý hôm nay",
            type: HomeSectionType.featured
        });
        let top: HomeSection = createHomeSection({
            id: 'top',
            title: "Top view ngày",
            view_more: false,
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
            title: "Mới thêm",
            view_more: true,
        });


        //Load empty sections
        sectionCallback(top);
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);
        sectionCallback(newest);

        ///Get the section data
        //Featured
        let url = ``
        let request = createRequestObject({
            url: 'https://hencb.top/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('.item__wrap ', '.slider__container .slider__item').toArray()) {
            let title = $(`.slider__content .post-title`, obj).text().trim();
            let subtitle = $(`.slider__content .chapter-item a`, obj).first().text().trim();
            const image = $('.slider__thumb a > img', obj).attr('data-src') ? $('.slider__thumb a > img', obj).attr('data-src').replace('-110x150', '') : $('.slider__thumb a > img', obj).attr('src').replace('-110x150', '');
            let id = $(`.slider__thumb a`, obj).attr('href') ?? title;
            featuredItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: (subtitle),
                }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //top
        url = '';
        request = createRequestObject({
            url: 'https://hencb.top/',
            method: "GET",
        });
        let topItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.popular-item-wrap', '#manga-recent-2 .widget-content').toArray()) {
            let title = $(`.popular-content a`, obj).text().trim();
            const image = $(`.popular-img > a > img`, obj).attr('data-src') ? $(`.popular-img > a > img`, obj).attr('data-src').replace('-75x106', '') : $(`.popular-img > a > img`, obj).attr('src').replace('-75x106', '');
            let id = $(`.popular-img > a`, obj).attr('href') ?? title;
            topItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
                title: createIconText({
                    text: decodeHTMLEntity(title),
                })
            }))
        }
        top.items = topItems;
        sectionCallback(top);

        //Hot
        url = '';
        request = createRequestObject({
            url: 'https://hencb.top/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.popular-item-wrap', '#manga-recent-3 .widget-content').toArray()) {
            let title = $(`.popular-content a`, obj).text().trim();
            const image = $(`.popular-img > a > img`, obj).attr('data-src') ? $(`.popular-img > a > img`, obj).attr('data-src').replace('-75x106', '') : $(`.popular-img > a > img`, obj).attr('src').replace('-75x106', '');
            let id = $(`.popular-img > a`, obj).attr('href') ?? title;
            hotItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
                title: createIconText({
                    text: decodeHTMLEntity(title),
                })
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //New Updates
        url = '';
        request = createRequestObject({
            url: 'https://hencb.top/?s&post_type=wp-manga&m_orderby=latest',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? $('.c-image-hover > a > img', obj).attr('src');
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(image),
                title: createIconText({
                    text: decodeHTMLEntity(title) ?? "",
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
            url: 'https://hencb.top/?s&post_type=wp-manga&m_orderby=views',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? $('.c-image-hover > a > img', obj).attr('src');
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            newAddItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
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
            url: 'https://hencb.top/?s&post_type=wp-manga&m_orderby=new-manga',
            method: "GET",
        });
        let newItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.c-tabs-item__content', '.tab-content-wrap').toArray()) {
            let title = $(`.post-title > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('.c-image-hover > a > img', obj).attr('data-src') ?? $('.c-image-hover > a > img', obj).attr('src');
            let id = $(`.c-image-hover > a`, obj).attr('href') ?? title;
            newItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(image),
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
        let url2 = ''
        let select = 1;
        switch (homepageSectionId) {
            case "new":
                url = `https://hencb.top/page/${page}/?s&post_type=wp-manga&m_orderby=new-manga`;
                url2 = `https://hencb.top/page/${page + 1}/?s&post_type=wp-manga&m_orderby=new-manga`;
                select = 0;
                break;
            case "new_updated":
                url = `https://hencb.top/page/${page}/?s&post_type=wp-manga&m_orderby=latest`;
                url2 = `https://hencb.top/page/${page + 1}/?s&post_type=wp-manga&m_orderby=latest`;
                select = 1;
                break;
            case "view":
                url = `https://hencb.top/page/${page}/?s&post_type=wp-manga&m_orderby=views`;
                url2 = `https://hencb.top/page/${page + 1}/?s&post_type=wp-manga&m_orderby=views`;
                select = 2;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method
        });

        url = url2;
        const request2 = createRequestObject({
            url, // url = url2
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        const response2 = await this.requestManager.schedule(request2, 1);
        const $ = this.cheerio.load(response.data);
        const $2 = this.cheerio.load(response2.data);
        let manga = parseViewMore($, select);
        let manga2 = parseViewMore($2, select);
        metadata = !isLastPage($) ? { page: page + 2 } : undefined;
        return createPagedResults({
            results: manga.concat(manga2),
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        var status: any[] = [];
        var year: any[] = [];
        var sort: any[] = [];
        var genre: any[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                genre.push(value);
            } else {
                switch (value.split(".")[0]) {
                    case 'status':
                        status.push(value.split(".")[1]);
                        break
                    case 'year':
                        year.push(value.split("year.")[1]);
                        break
                    case 'sort':
                        sort.push(value.split("&")[2]);
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
        var url = '';
        var set = 1;
        //search chưa ngon lắm :))
        if (year.length !== 0) { //year + sort
            if (tags[0].split('.')[0] === 'year' || tags[0].split('.')[0] === 'sort') {
                if (year.length !== 0 && sort.length !== 0) {
                    set = 0;
                    url = encodeURI(`${year[0]}page/${page}/?${sort[0]}`)
                } else {
                    if (tags[0].split('.')[0] === 'year') {
                        set = 0;
                        url = encodeURI(`${year[0]}page/${page}/`);
                    } else {
                        set = 1;
                        url = encodeURI(`https://hencb.top/page/${page}/?s&post_type=wp-manga&${sort[0]}`);
                    }
                }
            }
        } else { //keyword + genre + status + sort
            set = 1;
            url = encodeURI(`https://hencb.top/page/${page}/?s=${query.title ?? ""}&post_type=wp-manga&${convertGenres(genre)}&op=&author=&artist=&release=&adult=&${convertStatus(status)}&${sort[0]}`);
        }
        const request = createRequestObject({
            url,
            method: "GET"
        });

        url = url.replace(`page/${page}/`, `page/${page + 1}/`);
        const request2 = createRequestObject({
            url,
            method: "GET"
        });

        const data = await this.requestManager.schedule(request, 1);
        const data2 = await this.requestManager.schedule(request2, 1);
        let $ = this.cheerio.load(data.data);
        let $2 = this.cheerio.load(data2.data);
        const tiles = parseSearch($, set);
        const tiles2 = parseSearch($2, set);

        metadata = !isLastPage($) ? { page: page + 2 } : undefined;

        return createPagedResults({
            results: tiles.concat(tiles2),
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const tags2: Tag[] = [];
        const tags3: Tag[] = [];
        const tags4: Tag[] = [];

        const counts = [];

        let url = `https://hencb.top/?s=&post_type=wp-manga`
        let request = createRequestObject({
            url: url,
            method: "GET",
        });
        let response = await this.requestManager.schedule(request, 1)
        let $ = this.cheerio.load(response.data);

        let url2 = `https://hencb.top/manga/`
        let request2 = createRequestObject({
            url: url2,
            method: "GET",
        });
        let response2 = await this.requestManager.schedule(request2, 1)
        let $2 = this.cheerio.load(response2.data);
        for (const cc of $2('a', '.list-unstyled').toArray()) {
            const count = $2('.count', cc).text();
            counts.push(count);
        }

        //the loai
        var i = 0;
        for (const tag of $('.checkbox', '.checkbox-group').toArray()) {
            const label = $('label', tag).text().trim() + counts[i];
            const id = $('input', tag).attr('id') ?? label;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
            i++;
        }

        //tinh trang
        for (const tag of $('.checkbox-inline', '.search-advanced-form > .form-group:nth-child(9) ').toArray()) {
            const label = $('label', tag).text().trim();
            const id = 'status.' + $('input', tag).attr('value') ?? label;
            if (!id || !label) continue;
            tags2.push({ id: id, label: label });
        }

        //sap xep
        for (const tag of $('li', '.c-tabs-content').toArray()) {
            const label = $('a', tag).text().trim();
            const id = 'sort.' + $('a', tag).attr('href') ?? label;
            if (!id || !label) continue;
            tags4.push({ id: id, label: label });
        }

        url = `https://hencb.top/manga/`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        response = await this.requestManager.schedule(request, 1)
        $ = this.cheerio.load(response.data);

        //nam
        for (const tag of $('li', '#wp_manga_release_id-2 .c-released_content .list-released').toArray()) {
            for (const tag2 of $('a', tag).toArray()) {
                const label = $(tag2).text().trim();
                const id = 'year.' + $(tag2).attr('href') ?? label;
                if (!id || !label) continue;
                tags3.push({ id: id, label: label });
            }
        }

        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        createTagSection({ id: '1', label: 'Tình Trạng', tags: tags2.map(x => createTag(x)) }),
        // createTagSection({ id: '2', label: 'Năm', tags: tags3.map(x => createTag(x)) }),
        createTagSection({ id: '3', label: 'Xếp theo', tags: tags4.map(x => createTag(x)) })
        ]
        return tagSections;
    }
}