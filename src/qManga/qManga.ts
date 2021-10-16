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

import { parseSearch, parseViewMore, isLastPage, decodeHTMLEntity } from "./qMangaParser"

const method = 'GET'

export const qMangaInfo: SourceInfo = {
    version: '2.0.0',
    name: 'qManga',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from qManga',
    websiteBaseURL: `https://qmanga.co/`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class qManga extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 0.5,
        requestTimeout: 15000
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
        let creator = $('.writer a').text().trim();
        let status = $('.status_commic > p').text().trim(); //completed, 1 = Ongoing
        let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        let desc = $(".desc-commic-detail").text().trim();
        for (const t of $('.categories-list-detail-commic > li > a').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        const image = $('.image-commic-detail img').attr('data-src') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.title-commic-detail').text().trim()],
            image: decodeHTMLEntity(encodeURI(image)),
            status: statusFinal,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
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
        for (const obj of $('.ul-list-chaper-detail-commic > li').toArray()) {
            i++;
            let id = $('a', obj).first().attr('href');
            let chapNum = parseFloat($('a', obj).first().text().trim()?.split(' ')[1]);
            let name = $('a', obj).first().text().trim();
            let time = $('span', obj).first().text().trim().split('-');
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
        for (let obj of $('#aniimated-thumbnial > img').toArray()) {
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
        let featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới nhất",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Nổi bật",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Phổ biến",
            view_more: true,
        });

        ///Get the section data
        sectionCallback(newUpdated);
        sectionCallback(hot);
        sectionCallback(view);

        //New Updates
        let request = createRequestObject({
            url: 'https://qmanga.co/de-nghi/pho-bien/moi-nhat',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('li', '.detail-bxh-ul').toArray().splice(0, 15)) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-bxh img', element).attr('data-src') ?? "";
            let id = $('.image-commic-bxh > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //hot
        request = createRequestObject({
            url: 'https://qmanga.co/danh-muc/noi-bat',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('li', '.content-tab').toArray().splice(0, 15)) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-tab img', element).attr('data-src') ?? "";
            let id = $('.image-commic-tab > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            hotItems.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //view
        request = createRequestObject({
            url: 'https://qmanga.co/danh-muc/pho-bien',
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('li', '.content-tab').toArray().splice(0, 15)) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-tab img', element).attr('data-src') ?? "";
            let id = $('.image-commic-tab > a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);

        //featured
        request = createRequestObject({
            url: 'https://qmanga.co/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('a', '.top-new').toArray()) {
            let title = $('img', element).attr('title');
            let image = $('img', element).attr('data-src') ?? $('img', element).attr('src');
            let id = $(element).attr('href');
            // let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            featuredItems.push(createMangaTile({
                id: id ?? "",
                image: decodeHTMLEntity(encodeURI(image ?? "https://qmanga.co/image/defaul-load.png")),
                title: createIconText({ text: title ?? "" }),
                // subtitleText: createIconText({ text: subtitle }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://qmanga.co/de-nghi/pho-bien/moi-nhat?page=${page}`;
                select = 1;
                break;
            case "hot":
                url = `https://qmanga.co/danh-muc/noi-bat?page=${page}`;
                select = 2;
                break;
            case "view":
                url = `https://qmanga.co/danh-muc/pho-bien?page=${page}`;
                select = 3;
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
        const search = {
            cate: '',
            translator: "",
            writer: "",
            status: "",
            sort: "moi-nhat"
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
                    break
                case 'translator':
                    search.translator = (value.split(".")[1]);
                    break
                case 'writer':
                    search.writer = (value.split(".")[1]);
                    break
                case 'status':
                    search.status = (value.split(".")[1]);
                    break
                case 'sort':
                    search.sort = (value.split(".")[1]);
                    break
            }
        })
        const request = createRequestObject({
            url: query.title ? encodeURI(`https://qmanga.co/tim-kiem?q=${query.title}&page=${page}`) :
                (tags[0].includes('http') ? (tags[0] + `?page=${page}`) :
                    encodeURI(`https://qmanga.co/danh-muc/${search.cate}?page=${page}`)),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($, query, tags);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const tags2: Tag[] = [
            {
                id: 'https://qmanga.co/bang-xep-hang/top-ngay',
                label: 'Top ngày'
            },
            {
                id: 'https://qmanga.co/bang-xep-hang/top-tuan',
                label: 'Top tuần'
            },
            {
                id: 'https://qmanga.co/bang-xep-hang/top-thang',
                label: 'Top tháng'
            }
        ];
        const tags5: Tag[] = [
            {
                id: 'status.',
                label: 'Tất cả'
            },
            {
                id: 'status.1',
                label: 'Đã hoàn thành'
            },
            {
                id: 'status.2',
                label: 'Chưa hoàn thành'
            }
        ];
        const tags6: Tag[] = [
            {
                id: 'sort.moi-nhat',
                label: 'Mới nhất'
            },
            {
                id: 'sort.dang-hot',
                label: 'Đang hot'
            },
            {
                id: 'sort.cu-nhat',
                label: 'Cũ nhất'
            }
        ];

        const url = `https://qmanga.co/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.menu-cate-mobile a').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('href')?.split('/').pop()?.trim();
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Bảng xếp hạng', tags: tags2.map(x => createTag(x)) }),
        createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            // createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
            // createTagSection({ id: '5', label: 'Sắp xếp', tags: tags6.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://qmanga.co/'
        }
    }
}