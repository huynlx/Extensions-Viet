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
    HomeSectionType,
    Request,
    Response
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore, decodeHTMLEntity } from "./TruyenVNParser"

const DOMAIN = 'https://truyenvnmoi.com/'
const method = 'GET'

export const TruyenVNInfo: SourceInfo = {
    version: '1.0.1',
    name: 'TruyenVN',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyenVN',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class TruyenVN extends Source {
    getMangaShareUrl(mangaId: string): string { return encodeURI(`${mangaId}`) };
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
        const url = encodeURI(`${mangaId}`);
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.comic-description > .inner').text();
        for (const t of $('.genre > a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        creator = $('.author > a').text().trim();
        status = $('.status').clone().children().remove().end().text().trim().toLowerCase().includes("hoàn thành") ? 0 : 1;
        const image = $('.book  > img').attr('src');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($('h1.name').text().trim())],
            image: image,
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: encodeURI(`${mangaId}`),
            method,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        for (const obj of $("#chapterList a").toArray()) {
            var chapNum = parseFloat($('span:first-child', obj).text().trim().split(' ')[1]);
            var time = $('span:last-child', obj).text().trim().split('/');
            chapters.push(createChapter(<Chapter>{
                id: $(obj).first().attr('href'),
                chapNum: chapNum,
                name: $('span:first-child', obj).text().trim(),
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

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('.chapter-content img').toArray()) {
            if (!obj.attribs['src']) continue;
            let link = obj.attribs['src'];
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
            title: "On Top",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Đề Cử",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện Mới Cập Nhật",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện Full (Đã hoàn thành)",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(featured);
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        //Hot
        let url = '';
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('.entry', '.container > section:nth-child(2) .form-row').toArray()) {
            let title = $(`h3.name > a`, obj).text().trim();
            let subtitle = $(`span.link`, obj).text().trim();
            const image = $(`a > img`, obj).attr('data-src');
            let id = $(`a`, obj).attr("href") ?? title;
            // if (!id || !subtitle) continue;
            hotItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //Featured
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let topItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('a', '.container > section#home').toArray()) {
            let title = $(`h2.name > span`, obj).text().trim();
            let subtitle = $(`.badge > h3`, obj).text().trim();
            const image = $(obj).css('background-image');
            const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "");
            let id = $(obj).attr("href") ?? title;
            topItems.push(createMangaTile({
                id: id,
                image: bg,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }))
        }
        featured.items = topItems;
        sectionCallback(featured);

        //New Updates
        url = '';
        request = createRequestObject({
            url: 'https://truyenvn.tv/danh-sach-truyen',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.entry ', '.form-row').toArray().splice(0, 15)) {
            let title = $(`a`, obj).attr('title');
            let subtitle = $(`span.link`, obj).text().trim();
            const image = $(`a > img`, obj).attr('data-src');
            let id = $(`a`, obj).attr("href") ?? title;
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //New Added
        url = DOMAIN
        request = createRequestObject({
            url: 'https://truyenvn.tv/truyen-hoan-thanh',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.entry ', '.form-row').toArray().splice(0, 15)) {
            let title = $(`a`, obj).attr('title');
            let subtitle = $(`span.link`, obj).text().trim();
            const image = $(`a > img`, obj).attr('data-src');
            let id = $(`a`, obj).attr("href") ?? title;
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }))
        }
        newAdded.items = newAddItems;
        sectionCallback(newAdded);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://truyenvn.tv/danh-sach-truyen/page/${page}`;
                break;
            case "new_added":
                url = `https://truyenvn.tv/truyen-hoan-thanh/page/${page}`;
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
        const search = {
            name: query.title ?? '',
            genres: ''
        };
        search.genres = tags[0];
        var url = '';
        if (search.name) {
            url = `https://truyenvn.tv/danh-sach-truyen/page/${page}?q=${search.name}`
        } else {
            url = search.genres + `/page/${page}`;
        }

        const request = createRequestObject({
            url,
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
        const request = createRequestObject({
            url: 'https://truyenvn.tv/the-loai-truyen',
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (const tag of $('.theloai a').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('href') ?? label;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tags1: Tag[] = [
            {
                "id": "https://truyenvn.tv/truyen-hot",
                "label": "Top All"
            },
            {
                "id": "https://truyenvn.tv/top-ngay",
                "label": "Top Ngày"
            },
            {
                "id": "https://truyenvn.tv/top-tuan",
                "label": "Top Tuần"
            },
            {
                "id": "https://truyenvn.tv/top-thang",
                "label": "Top Tháng"
            },
            {
                "id": "https://truyenvn.tv/top-nam",
                "label": "Top Năm"
            }
        ]

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Bảng Xếp Hạng', tags: tags1.map(x => createTag(x)) })
        ]
        return tagSections;
    }
}
