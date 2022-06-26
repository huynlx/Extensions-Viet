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
    HomeSectionType,
    LanguageCode,
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage, decodeHTMLEntity } from "./TruyentranhtuanParser"

const DOMAIN = 'http://truyentranhtuan.com/'
const method = 'GET'

export const TruyentranhtuanInfo: SourceInfo = {
    version: '1.0.1',
    name: 'Truyentranhtuan',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyentranhtuan',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Truyentranhtuan extends Source {
    getMangaShareUrl(mangaId: string): string { return mangaId };
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
        const url = mangaId;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let statusFinal = 1;
        creator = $('#infor-box span[itemprop="author"] > span[itemprop="name"]').text().trim();
        for (const t of $('p:nth-of-type(3) > a', $('#infor-box h1[itemprop="name"]').next()).toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        let status = $('p:nth-of-type(4) > a', $('#infor-box h1[itemprop="name"]').next()).text().trim(); //completed, 1 = Ongoing
        statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        let desc = $("#manga-summary").text();
        const image = $('.manga-cover img').attr("src") ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: decodeHTMLEntity(desc),
            titles: [decodeHTMLEntity($('#infor-box h1[itemprop="name"]').text().trim())],
            image: encodeURI(image),
            status: statusFinal,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: mangaId,
            method,
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapters: Chapter[] = [];
        const timeList = $('#manga-chapter .date-name').toArray().reverse();
        const titleList = $('#manga-chapter .chapter-name').toArray();
        for (const i in titleList.reverse()) {
            let id = $('a', titleList[i]).attr('href');
            let chapNum = parseFloat($('a', titleList[i]).text()?.split(' ').pop());
            let name = $('a', titleList[i]).text().trim();
            let time = $(timeList[i]).text().trim().split('.');
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: isNaN(chapNum) ? Number(i) + 1 : chapNum,
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
        let arrayImages = $.html().match(/slides_page_path = (.*);/);
        let listImages = JSON.parse(arrayImages?.[1] ?? "");
        let slides_page = [];
        if (listImages.length === 0) {
            arrayImages = $.html().match(/slides_page_url_path = (.*);/);
            listImages = JSON.parse(arrayImages?.[1] ?? "");
            slides_page = listImages;
        } else {
            slides_page = listImages;
            // sort
            let length_chapter = slides_page.length - 1;
            for (let i = 0; i < length_chapter; i++)
                for (let j = i + 1; j < slides_page.length; j++)
                    if (slides_page[j] < slides_page[i]) {
                        let temp = slides_page[j];
                        slides_page[j] = slides_page[i];
                        slides_page[i] = temp;
                    }
            // !sort
        }

        const pages: string[] = [];
        for (let obj of slides_page) {
            let link = encodeURI(obj);
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
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Hot",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện mới",
            view_more: true,
        });

        //Load empty sections
        // sectionCallback(featured);
        // sectionCallback(hot);
        sectionCallback(newUpdated);

        ///Get the section data
        //featured
        // let request = createRequestObject({
        //     url: DOMAIN,
        //     method: "GET",
        // });
        // let featuredItems: MangaTile[] = [];
        // let data = await this.requestManager.schedule(request, 1);
        // let $ = this.cheerio.load(data.data);
        // for (const element of $('.owl-carousel .slide-item').toArray()) {
        //     let title = $('.slide-info > h3 > a', element).text().trim();
        //     let img = $('a > img', element).attr("data-src") ?? $('a > img', element).attr("src");
        //     let id = $('.slide-info > h3 > a', element).attr('href') ?? title;
        //     let subtitle = $(".detail-slide > a", element).text().trim();
        //     featuredItems.push(createMangaTile(<MangaTile>{
        //         id: id ?? "",
        //         image: img ?? "",
        //         title: createIconText({ text: title }),
        //         subtitleText: createIconText({ text: subtitle }),
        //     }));
        // }
        // featured.items = featuredItems;
        // sectionCallback(featured);

        // Hot
        // request = createRequestObject({
        //     url: DOMAIN,
        //     method: "GET",
        // });
        // let popular: MangaTile[] = [];
        // data = await this.requestManager.schedule(request, 1);
        // $ = this.cheerio.load(data.data);
        // for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
        //     let title = $('.caption > h3 > a', element).text().trim();
        //     let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
        //     let id = $('.caption > h3 > a', element).attr('href') ?? title;
        //     let subtitle = $("ul > li:first-child > a", element).text().trim();
        //     popular.push(createMangaTile(<MangaTile>{
        //         id: id ?? "",
        //         image: img ?? "",
        //         title: createIconText({ text: title }),
        //         subtitleText: createIconText({ text: subtitle }),
        //     }));
        // }
        // hot.items = popular;
        // sectionCallback(hot);

        //update
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('#new-chapter .manga-update').toArray()) {
            let title = $('a', element).first().text().trim();
            let img = $('img', element).attr('src').replace('-80x90', '');
            let id = $('a', element).attr('href') ?? title;
            let subtitle = $('a', element).last().text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(img) ?? "",
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `http://truyentranhtuan.com/page/${page}/`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method
        });

        let data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        let manga = parseViewMore($);
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        let { availableTags } = require('./search');
        var key = query.title;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        let tiles: any = [];
        if (query.title) {
            var json = availableTags.filter(function (el: any) {
                return el.label.toLowerCase().includes(key?.toLowerCase())
            });
            let manga: MangaTile[] = [];
            for (const i of json) {
                manga.push(createMangaTile({
                    id: i.url,
                    image: '',
                    title: createIconText({ text: decodeHTMLEntity(i.label) }),
                    // subtitleText: createIconText({ text: subtitle }),
                }))
            }
            tiles = manga;
        } else {
            const request = createRequestObject({
                url: tags[0],
                method: "GET",
            });

            let data = await this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            tiles = parseSearch($);
        }

        metadata = undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen",
                "label": "Tất cả"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/top/top-50",
                "label": "Top 50"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/trang-thai/dang-tien-hanh",
                "label": "Đang tiến hành"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/trang-thai/tam-dung",
                "label": "Tạm ngừng"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/trang-thai/hoan-thanh/",
                "label": "Hoàn thành"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/4-koma",
                "label": "4-koma"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/action",
                "label": "Action"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/adventure",
                "label": "Adventure"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/anime",
                "label": "Anime"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/comedy",
                "label": "Comedy"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/comic",
                "label": "Comic"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/drama",
                "label": "Drama"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/ecchi-2",
                "label": "ecchi"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/fantasy",
                "label": "Fantasy"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/gender-bender",
                "label": "Gender Bender"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/historical",
                "label": "Historical"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/horror",
                "label": "Horror"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/josei",
                "label": "Josei"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/live-action",
                "label": "Live Action"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/manhua",
                "label": "Manhua"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/manhwa",
                "label": "Manhwa"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/martial-arts",
                "label": "Martial Arts"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/mature-2",
                "label": "Mature"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/mecha",
                "label": "Mecha"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/mystery",
                "label": "Mystery"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/one-shot",
                "label": "One Shot"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/psychological",
                "label": "Psychological"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/romance",
                "label": "Romance"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/school-life",
                "label": "School Life"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/sci-fi",
                "label": "Sci-fi"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/seinei",
                "label": "Seinen"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/shoujo",
                "label": "Shoujo"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/shoujo-ai-2",
                "label": "Shoujo Ai"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/shounen",
                "label": "Shounen"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/slice-of-life",
                "label": "Slice of Life"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/smut",
                "label": "Smut"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/sports",
                "label": "Sports"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/supernatural",
                "label": "Supernatural"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/tragedy",
                "label": "Tragedy"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/truyen-scan",
                "label": "Truyện scan"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/truyen-tranh-viet-nam",
                "label": "Truyện tranh Việt Nam"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/webtoon",
                "label": "Webtoon"
            },
            {
                "id": "http://truyentranhtuan.com//danh-sach-truyen/the-loai/yuri",
                "label": "Yuri"
            }
        ];

        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}