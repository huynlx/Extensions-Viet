import { test } from "mocha"
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
    Response,
    MangaTile,
    Tag,
    LanguageCode,
    Request,
    HomeSectionType
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage, decodeHTMLEntity } from "./BaotangtruyentranhParser"

const DOMAIN = 'https://baotangtruyengo.com/'
const method = 'GET'

export const BaotangtruyentranhInfo: SourceInfo = {
    version: '1.0.1',
    name: 'Baotangtruyentranh',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Baotangtruyentranh',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Baotangtruyentranh extends Source {
    protected convertTime(timeAgo: string): Date {
        let time: Date
        let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0])
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed
        if (timeAgo.includes('giây')) {
            time = new Date(Date.now() - trimmed * 1000) // => mili giây (1000 ms = 1s)
        } else if (timeAgo.includes('phút')) {
            time = new Date(Date.now() - trimmed * 60000)
        } else if (timeAgo.includes('giờ')) {
            time = new Date(Date.now() - trimmed * 3600000)
        } else if (timeAgo.includes('ngày')) {
            time = new Date(Date.now() - trimmed * 86400000)
        } else if (timeAgo.includes('tuần')) {
            time = new Date(Date.now() - trimmed * 86400000 * 7)
        } else if (timeAgo.includes('tháng')) {
            time = new Date(Date.now() - trimmed * 86400000 * 7 * 4)
        } else if (timeAgo.includes('năm')) {
            time = new Date(Date.now() - trimmed * 86400000 * 7 * 4 * 12)
        } else {
            if (timeAgo.includes(":")) {
                let split = timeAgo.split(' ');
                let H = split[0]; //vd => 21:08
                let D = split[1]; //vd => 25/08 
                let fixD = D.split('/');
                let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
                time = new Date(finalD + ' ' + H);
            } else {
                let split = timeAgo.split('/'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time
    }
    getMangaShareUrl(mangaId: string): string { return (mangaId) };
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
        let creator = decodeHTMLEntity($('.author p').last().text().trim());
        let statusFinal = $('.status p').last().text().trim().includes('Đang') ? 1 : 0;
        for (const t of $('a', '.kind').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: decodeHTMLEntity(genre), id }));
        }

        let desc = $("#summary").text();
        let image = $('.col-image img').attr("data-src") ?? "";

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($('.title-detail').text().trim())],
            image: encodeURI(decodeHTMLEntity(image)),
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
        for (const obj of $('#nt_listchapter .row:not(.heading)').toArray()) {
            let id = $('a', obj).first().attr('href');
            let chapNum = parseFloat($('a', obj).first().text()?.split(' ')[1]);
            let name = ($('a', obj).first().text().trim() === ('Chapter ' + chapNum.toString())) ? '' : $('a', obj).first().text().trim();
            if ($('.coin-unlock', obj).attr('title')) {
                name = 'LOCKED (' + $('.coin-unlock', obj).attr('title') + ')';
            }
            let time = $('.col-xs-4', obj).text().trim();
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: chapNum,
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: this.convertTime(decodeHTMLEntity(time))
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
        for (let obj of $('.reading-detail img').toArray()) {
            let image = $(obj).attr('data-src');
            pages.push(encodeURI(image));
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
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let trans: HomeSection = createHomeSection({
            id: 'trans',
            title: "TRUYỆN DỊCH",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(trans);

        ///Get the section dat

        //New Updates
        let request = createRequestObject({
            url: 'https://baotangtruyentranh.com/?page=1&typegroup=0',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('.row .item').toArray()) {
            let title = $('h3 > a', element).text().trim();
            let image = $('.image img', element).attr("data-src");
            let id = $('h3 > a', element).attr('href');
            let subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //featured
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.items-slide .item').toArray()) {
            let title = $('.slide-caption h3', element).text().trim();
            let image = $('a img', element).attr("data-src");
            let id = $('a', element).attr('href');
            let subtitle = $(".slide-caption > a", element).first().text().trim() + ' | ' + $(".time", element).first().text().trim();
            featuredItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //trans
        request = createRequestObject({
            url: 'https://baotangtruyentranh.com/?page=1&typegroup=1',
            method: "GET",
        });
        let transItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.row .item').toArray()) {
            let title = $('h3 > a', element).text().trim();
            let image = $('.image img', element).attr("data-src");
            let id = $('h3 > a', element).attr('href');
            let subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
            transItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        trans.items = transItems;
        sectionCallback(trans);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://baotangtruyentranh.com/?page=${page}&typegroup=0`;
                select = 1;
                break;
            case "trans":
                url = `https://baotangtruyentranh.com/?page=${page}&typegroup=1`;
                select = 1;
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
            cate: "",
            status: "-1",
            sort: "0",
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
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
            url: query.title ? encodeURI(`https://baotangtruyentranh.com/tim-truyen?keyword=${query.title}&page=${page}`)
                : encodeURI(`https://baotangtruyentranh.com/tim-truyen/${search.cate}?status=${search.status}&sort=${search.sort}&page=${page}`),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
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
        const tags2: Tag[] = [
            {
                id: 'status.-1',
                label: 'Tất cả'
            },
            {
                id: 'status.2',
                label: 'Hoàn thành'
            },
            {
                id: 'status.1',
                label: 'Đang tiến hành'
            }
        ];
        const tags3 = [
            {
                id: 'sort.13',
                label: 'Top ngày'
            },
            {
                id: 'sort.12',
                label: 'Top tuần'
            },
            {
                id: 'sort.11',
                label: 'Top tháng'
            },
            {
                id: 'sort.10',
                label: 'Top all'
            },
            {
                id: 'sort.20',
                label: 'Theo dõi'
            },
            {
                id: 'sort.25',
                label: 'Bình luận'
            },
            {
                id: 'sort.15',
                label: 'Truyện mới'
            },
            {
                id: 'sort.30',
                label: 'Số chapter'
            },
            {
                id: 'sort.0',
                label: 'Ngày cập nhật'
            }
        ]

        const url = DOMAIN;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.megamenu .nav a').toArray()) {
            let label = $(tag).text().trim();
            let id = 'cate.' + $(tag).attr('href').split('/').pop();
            if (label === 'Tất cả') id = 'cate.';
            if (!id || !label) continue;
            tags.push({ id: id, label: decodeHTMLEntity(label) });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình trạng', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags3.map(x => createTag(x)) }),

        ]
        return tagSections;
    }
}
