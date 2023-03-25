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
    MangaTile,
    Tag,
    LanguageCode,
    HomeSectionType,
    Request,
    Response
} from "paperback-extensions-common";
import { parseSearch, isLastPage, parseViewMore } from "./HentaiVVParser";

const DOMAIN = 'https://hentaivv1.com/';
const method = 'GET';

export const HentaiVVInfo: SourceInfo = {
    version: '2.5.1',
    name: 'HentaiVV',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVV',
    websiteBaseURL: `https://hentaivv1.com/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
};

export class HentaiVV extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}`; };
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
                };

                return request;
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response;
            }
        }
    });

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
        let desc = $('.gioi_thieu').text().trim();
        for (const t of $('.text-center > .btn-primary-border > a').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        if ($('#thong_tin tbody > tr:nth-child(1) > td:nth-child(1)').text().trim() === 'Tên Khác:') {
            creator = $('#thong_tin tbody > tr:nth-child(2) > th:nth-child(2)').text().trim();
            status = $('#thong_tin tbody > tr:nth-child(3) > th:nth-child(2) > span').text().trim().toLowerCase().includes("đang") ? 1 : 0;
        } else {
            creator = $('#thong_tin tbody > tr:nth-child(1) > th:nth-child(2)').text().trim();
            status = $('#thong_tin tbody > tr:nth-child(2) > th:nth-child(2) > span').text().trim().toLowerCase().includes("đang") ? 1 : 0;
        }
        const image = $('.book3d img').attr('data-src') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.row > .crop-text-1').first().text().trim()],
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
        const page = $('#id_pagination > li.active > a').text().trim();
        const id = $("#views").attr('data-id');
        const request2 = createRequestObject({
            url: 'https://hentaivv1.com/wp-admin/admin-ajax.php',
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                'action': 'all_chap',
                'id': id
            }
        });
        const response2 = await this.requestManager.schedule(request2, 1);
        const $2 = this.cheerio.load(response2.data);
        const test = $("#dsc > .listchap > li:nth-child(1) a").first().text().trim();
        if (!test) {
            if (($('#pagination .pagination-child').first().text().trim()) === '1/1') {
                chapters.push(createChapter(<Chapter>{
                    id: mangaId,
                    chapNum: 1,
                    name: 'Oneshot',
                    mangaId: mangaId,
                    langCode: LanguageCode.VIETNAMESE,
                }));
            } else {
                for (const obj of $2("div").toArray()) {
                    i++;
                    chapters.push(createChapter(<Chapter>{
                        id: $('a', obj).first().attr('href'),
                        chapNum: i,
                        name: ($('a', obj).first().text().trim()),
                        mangaId: mangaId,
                        langCode: LanguageCode.VIETNAMESE,
                    }));
                }
            }
        } else {
            if (page) { //check xem có pagination không
                for (const p of $('a', '#id_pagination').toArray()) {
                    if (isNaN(Number($(p).text().trim()))) { //a ko phải số
                        continue;
                    } else {
                        const requestChap = createRequestObject({
                            url: `${mangaId + Number($(p).text().trim())}/#dsc`,
                            method,
                        });
                        const responseChap = await this.requestManager.schedule(requestChap, 1);
                        const $Chap = this.cheerio.load(responseChap.data);
                        for (const obj of $Chap("#dsc > .listchap > li").toArray()) {
                            i++;
                            chapters.push(createChapter(<Chapter>{
                                id: $('a', obj).first().attr('href'),
                                chapNum: i,
                                name: ($('a', obj).first().text().trim()),
                                mangaId: mangaId,
                                langCode: LanguageCode.VIETNAMESE,
                            }));
                        }
                    }
                }
            } else {
                for (const obj of $("#dsc > .listchap > li").toArray()) {
                    i++;
                    chapters.push(createChapter(<Chapter>{
                        id: $('a', obj).first().attr('href'),
                        chapNum: i,
                        name: ($('a', obj).first().text().trim()),
                        mangaId: mangaId,
                        langCode: LanguageCode.VIETNAMESE,
                    }));
                }
            }
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
        for (let obj of $('.reading img').toArray()) {
            if (!obj.attribs['data-echo']) continue;
            let link = obj.attribs['data-echo'].trim();
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
            title: "Truyện Hot",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện Mới Cập Nhật",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Truyện Ngẫu Nhiên",
            view_more: true,
        });
        let newest: HomeSection = createHomeSection({
            id: 'new',
            title: "Truyện Mới Nhất",
            view_more: true,
        });


        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);
        sectionCallback(newest);

        ///Get the section data
        //Featured
        let url = ``;
        let request = createRequestObject({
            url: 'https://hentaivv1.com/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('.premiumItem > .img > a', '#duoc-quan-tam .slider-item').toArray()) {
            let title = $(`.crop-text-2`, obj).text().trim();
            const image = $('img', obj).attr('data-src') ?? "";
            let id = $(obj).attr('href') ?? title;
            featuredItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                })
            }));
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //Hot
        url = '';
        request = createRequestObject({
            url: 'https://hentaivv1.com/truyen/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.theloai-thumlist').toArray()) {
            let title = $('a', obj).attr('title');
            const image = $(`a > img`, obj).attr('data-src');
            let id = $('a', obj).attr('href') ?? title;
            hotItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? ""
                })
            }));
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //New Updates
        url = '';
        request = createRequestObject({
            url: 'https://hentaivv1.com/tim-kiem/?title=&status=all&time=update',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.theloai-thumlist').toArray()) {
            let title = $(`.crop-text-2 > a`, obj).text().trim();
            // let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('a > img', obj).attr('data-src') ?? "";
            let id = $(`.crop-text-2 > a`, obj).attr('href') ?? title;
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? "",
                }),
                // subtitleText: createIconText({
                //     text: subtitle
                // }),
            }));
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //ngau nhien
        url = DOMAIN;
        request = createRequestObject({
            url: 'https://hentaivv1.com/tim-kiem/?title=&status=all&time=rand',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.theloai-thumlist').toArray()) {
            let title = $(`.crop-text-2 > a`, obj).text().trim();
            // let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('a > img', obj).attr('data-src') ?? "";
            let id = $(`.crop-text-2 > a`, obj).attr('href') ?? title;
            newAddItems.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({
                    text: title,
                }),
                // subtitleText: createIconText({
                //     text: (subtitle),
                // }),
            }));
        }
        view.items = newAddItems;
        sectionCallback(view);

        //Newest
        url = '';
        request = createRequestObject({
            url: 'https://hentaivv1.com/tim-kiem/?title=&status=all&time=new',
            method: "GET",
        });
        let newItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.theloai-thumlist').toArray()) {
            let title = $(`.crop-text-2 > a`, obj).text().trim();
            // let subtitle = $(`.chapter > a`, obj).text().trim();
            const image = $('a > img', obj).attr('data-src') ?? "";
            let id = $(`.crop-text-2 > a`, obj).attr('href') ?? title;
            newItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({
                    text: title ?? "",
                }),
                // subtitleText: createIconText({
                //     text: subtitle
                // }),
            }));
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
                url = `https://hentaivv1.com/tim-kiem/page/${page}/?title=&status=all&time=new`;
                select = 0;
                break;
            case "new_updated":
                url = `https://hentaivv1.com/tim-kiem/page/${page}/?title&status=all&time=update`;
                select = 1;
                break;
            case "view":
                url = `https://hentaivv1.com/tim-kiem/page/${page}/?title=&status=all&time=rand`;
                select = 2;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }));
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
        var time: any[] = [];
        var genre: any[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                genre.push(value);
            } else {
                switch (value.split(".")[0]) {
                    case 'status':
                        status.push(value.split(".")[1]);
                        break;
                    case 'time':
                        time.push(value.split(".")[1]);
                        break;
                }
            }
        });
        var genresFinal = '';
        const convertGenres = (genre: any[]) => {///genre=['ahegao','anal'] => cate%5B%5D=ahegao&cate%5B%5D=anal
            let y = [];
            for (const e of genre) {
                let x = 'cate%5B%5D=' + e;
                y.push(x);
            }
            genresFinal = (y ?? []).join("&");
            return genresFinal;
        };
        const request = createRequestObject({
            url: (`https://hentaivv1.com/tim-kiem/page/${page}/?title=${query.title ? encodeURI(query.title) : ""}&${convertGenres(genre)}&status=${status[0] ?? 'all'}&time=${time[0] ?? 'update'}`),
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
        const tags3: Tag[] = [];
        const url = `https://hentaivv1.com/tim-kiem/?title=`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        //the loai
        for (const tag of $('label', '#category > div:nth-child(2)').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('for') ?? label;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }

        //tinh trang
        for (const tag of $('#status > option', '#category > div:nth-child(3)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            tags2.push({ id: id, label: label });
        }

        //thoi gian
        for (const tag of $('#status > option', '#category > div:nth-child(4)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'time.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            tags3.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        createTagSection({ id: '1', label: 'Tình Trạng Truyện', tags: tags2.map(x => createTag(x)) }),
        createTagSection({ id: '2', label: 'Thời Gian', tags: tags3.map(x => createTag(x)) })];
        return tagSections;
    }
}