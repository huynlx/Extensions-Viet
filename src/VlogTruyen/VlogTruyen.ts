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
    Response,
    Request
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage } from "./VlogTruyenParser"

const method = 'GET'

export const VlogTruyenInfo: SourceInfo = {
    version: '2.6.1',
    name: 'VlogTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from VlogTruyen',
    websiteBaseURL: `https://vlogtruyen3.com/`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class VlogTruyen extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': 'https://vlogtruyen.net/'
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
        let creator = $('.top-detail-manga-content > .drawer:nth-child(5) a').text().trim();
        let status = $('.manga-status > p').text().trim(); //completed, 1 = Ongoing
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
            image: image,
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
        for (const obj of $('.ul-list-chaper-detail-commic > li').toArray().reverse()) {
            i++;
            let id = $('a', obj).first().attr('href');
            let chapNum = Number($('a', obj).first().attr('title')?.split(' ')[1]);
            let name = $('a', obj).first().attr('title');
            let time = $('span:nth-child(4)', obj).text().trim().split('-');
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
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới cập nhật",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Đang hot",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Xem nhiều",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(hot);
        sectionCallback(view);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: 'https://vlogtruyen.net/the-loai/moi-cap-nhap',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray().splice(0, 20)) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-tab > img', element).attr('data-src') ?? "";
            let id = $('a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //hot
        request = createRequestObject({
            url: 'https://vlogtruyen.net/the-loai/dang-hot',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray().splice(0, 20)) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-tab > img', element).attr('data-src') ?? "";
            let id = $('a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            hotItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //view
        request = createRequestObject({
            url: 'https://vlogtruyen.net/de-nghi/pho-bien/xem-nhieu',
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray().splice(0, 20)) {
            let title = $('.title-commic-tab', element).text().trim();
            let image = $('.image-commic-tab > img', element).attr('data-src') ?? "";
            let id = $('a', element).first().attr('href');
            let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://vlogtruyen.net/the-loai/moi-cap-nhap?page=${page}`;
                select = 1;
                break;
            case "hot":
                url = `https://vlogtruyen.net/the-loai/dang-hot?page=${page}`;
                select = 2;
                break;
            case "view":
                url = `https://vlogtruyen.net/de-nghi/pho-bien/xem-nhieu?page=${page}`;
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
        const search = {
            cate: '',
            translator: "",
            writer: "",
            status: "Trạng+thái",
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
            url: query.title ? encodeURI(`https://vlogtruyen.net/tim-kiem?q=${query.title}&page=${page}`) :
                (tags[0].includes('http') ? (tags[0] + `?page=${page}`) :
                    encodeURI(`https://vlogtruyen.net/the-loai/huynh?cate=${search.cate}&translator=${search.translator}&writer=${search.writer}&status=${search.status}&sort=${search.sort}&page=${page}`)),
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
                id: 'https://vlogtruyen.net/bang-xep-hang/top-tuan',
                label: 'Top tuần'
            },
            {
                id: 'https://vlogtruyen.net/bang-xep-hang/top-thang',
                label: 'Top tháng'
            },
            {
                id: 'https://vlogtruyen.net/bang-xep-hang/top-nam',
                label: 'Top năm'
            }
        ];
        const tags3: Tag[] = [];
        const tags4: Tag[] = [];
        const tags5: Tag[] = [];
        const tags6: Tag[] = [];

        const url = `https://vlogtruyen.net/the-loai/dang-hot`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('select[name="cate"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        //nhom dich
        for (const tag of $('select[name="translator"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'translator.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags3.push({ id: id, label: label });
        }
        //tac gia
        for (const tag of $('select[name="writer"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'writer.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags4.push({ id: id, label: label });
        }
        //trang thai
        for (const tag of $('select[name="status"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags5.push({ id: id, label: label });
        }
        //sap xep
        for (const tag of $('select[name="sort"] > option').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags6.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Bảng xếp hạng', tags: tags2.map(x => createTag(x)) }),
        createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        createTagSection({ id: '2', label: 'Nhóm dịch', tags: tags3.map(x => createTag(x)) }),
        createTagSection({ id: '3', label: 'Tác giả', tags: tags4.map(x => createTag(x)) }),
        createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
        createTagSection({ id: '5', label: 'Sắp xếp', tags: tags6.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}
