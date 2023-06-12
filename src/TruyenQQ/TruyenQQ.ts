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
    MangaUpdates,
    Request,
    Response
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore, parseUpdatedManga } from "./TruyenQQParser"

const DOMAIN = 'http://truyenqqne.com/'
const method = 'GET'

export const TruyenQQInfo: SourceInfo = {
    version: '3.0.1',
    name: 'TruyenQQ',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyenQQ',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        },
        {
            text: 'Notifications',
            type: TagType.GREEN
        }
    ]
}

export class TruyenQQ extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}truyen-tranh/${mangaId}` };
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
        const url = `${DOMAIN}truyen-tranh/${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = [];
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.story-detail-info').text();
        for (const t of $('a', '.list01').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        for (const c of $('a', '.txt > p:nth-of-type(1)').toArray()) {
            const name = $(c).text().trim()
            creator.push(name);
        }
        status = $('.txt > p:nth-of-type(2)').text().toLowerCase().includes("đang cập nhật") ? 1 : 0;
        const image = $('.left > img').attr('src') ?? "";
        return createManga({
            id: mangaId,
            author: creator.join(', '),
            artist: creator.join(', '),
            desc: desc === "" ? 'Không có mô tả' : desc,
            titles: [$('.center > h1').text().trim()],
            image: image,
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${DOMAIN}truyen-tranh/${mangaId}`,
            method,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        for (const obj of $(".works-chapter-list > .works-chapter-item").toArray().reverse()) {
            const timeStr = $('.col-md-2.col-sm-2.col-xs-4', obj).text().trim().split(/\//); //mm/dd/yyyy
            const time = new Date([timeStr[1], timeStr[0], timeStr[2]].join('/'))
            // time.setDate(time.getDate() + 1);
            // const time = new Date("09/18/2021");
            chapters.push(createChapter(<Chapter>{
                id: $('.col-md-10.col-sm-10.col-xs-8 > a', obj).attr('href')?.split('/').pop(),
                chapNum: parseFloat($('.col-md-10.col-sm-10.col-xs-8 > a', obj).text().split(' ')[1]),
                name: $('.col-md-10.col-sm-10.col-xs-8 > a', obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}truyen-tranh/${chapterId}`,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('.story-see-content > img').toArray()) {
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
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Yêu Thích",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện Vừa Cập Nhật",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện Mới",
            view_more: true,
        });
        let boy: HomeSection = createHomeSection({
            id: 'boy',
            title: "Truyện Con Trai",
            view_more: true,
        });
        let girl: HomeSection = createHomeSection({
            id: 'girl',
            title: "Truyện Con Gái",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(featured);
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);
        sectionCallback(boy);
        sectionCallback(girl);

        ///Get the section data
        //Featured
        let url = `${DOMAIN}`
        let request = createRequestObject({
            url: url,
            method: "GET",
        });
        let cc: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('div.is-child', '.container').toArray()) {
            let title = $(`.captions > h3`, manga).text().trim();
            let subtitle = $(`.chapter`, manga).text().trim();
            let image = $(`img.cover`, manga).attr("src") ?? "";
            let id = $(`a`, manga).attr("href")?.split("/").pop() ?? title;
            // if (!id || !title) continue;
            cc.push(createMangaTile(<MangaTile>{
                id: id.split("-chap")[0] + '.html',
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image.replace("290x191", "583x386"),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        featured.items = cc;
        sectionCallback(featured);

        //Hot
        url = `${DOMAIN}truyen-yeu-thich.html`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        let popular: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('li', '.list-stories').toArray().splice(0, 20)) {
            let title = $(`h3.title-book > a`, manga).text().trim();
            let subtitle = $(`.episode-book > a`, manga).text().trim();
            let image = $(`a > img`, manga).attr("src") ?? "";
            let id = $(`.story-item > a`, manga).attr("href")?.split("/").pop() ?? title;
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        //New Updates
        url = `${DOMAIN}#`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.latest').toArray().splice(0, 20)) {
            let title = $(`h3.title-book > a`, obj).text().trim();
            let subtitle = $(`.episode-book > a`, obj).text().trim();
            let image = $(`a > img`, obj).attr("src") ?? "";
            let id = $(`a`, obj).attr("href")?.split("/").pop() ?? title;
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
        url = `${DOMAIN}truyen-tranh-moi.html`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('li', '.list-stories').toArray().splice(0, 20)) {
            let title = $(`h3.title-book > a`, manga).text().trim();
            let subtitle = $(`.episode-book > a`, manga).text().trim();
            let image = $(`a > img`, manga).attr("src") ?? "";
            let id = $(`a`, manga).attr("href")?.split("/").pop() ?? title;
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

        //Boy
        url = `${DOMAIN}truyen-con-trai.html`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        let boyItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('li', '.list-stories').toArray().splice(0, 12)) {
            let title = $(`h3.title-book > a`, manga).text().trim();
            let subtitle = $(`.episode-book > a`, manga).text().trim();
            let image = $(`a > img`, manga).attr("src") ?? "";
            let id = $(`a`, manga).attr("href")?.split("/").pop() ?? title;
            // if (!id || !subtitle) continue;
            boyItems.push(createMangaTile({
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
        boy.items = boyItems;
        sectionCallback(boy);

        //Girl
        url = `${DOMAIN}truyen-con-gai.html`
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        let girlItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('li', '.list-stories').toArray().splice(0, 12)) {
            let title = $(`h3.title-book > a`, manga).text().trim();
            let subtitle = $(`.episode-book > a`, manga).text().trim();
            let image = $(`a > img`, manga).attr("src") ?? "";
            let id = $(`a`, manga).attr("href")?.split("/").pop() ?? title;
            // if (!id || !subtitle) continue;
            girlItems.push(createMangaTile({
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
        girl.items = girlItems;
        sectionCallback(girl);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}truyen-moi-cap-nhat/trang-${page}.html`;
                break;
            case "new_added":
                url = `${DOMAIN}truyen-tranh-moi/trang-${page}.html`;
                break;
            case "hot":
                url = `${DOMAIN}truyen-yeu-thich/trang-${page}.html`;
                break;
            case "boy":
                url = `${DOMAIN}truyen-con-trai/trang-${page}.html`;
                break;
            case "girl":
                url = `${DOMAIN}truyen-con-gai/trang-${page}.html`;
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

        const search = {
            category: '',
            country: "0",
            status: "-1",
            minchapter: "0",
            sort: "0"
        };

        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const category: string[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                category.push(value)
            } else {
                switch (value.split(".")[0]) {
                    case 'minchapter':
                        search.minchapter = (value.split(".")[1]);
                        break
                    case 'country':
                        search.country = (value.split(".")[1]);
                        break
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break
                }
            }
        })
        search.category = (category ?? []).join(",");
        const request = createRequestObject({
            url: query.title ? `${DOMAIN}tim-kiem/trang-${page}.html` : `${DOMAIN}tim-kiem-nang-cao/trang-${page}.html`,
            method: "GET",
            param: encodeURI(`?q=${query.title ?? ''}&category=${search.category}&country=${search.country}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}`)
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
        const url = `${DOMAIN}tim-kiem-nang-cao.html`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        const arrayTags2: Tag[] = [];
        const arrayTags3: Tag[] = [];
        const arrayTags4: Tag[] = [];
        const arrayTags5: Tag[] = [];
        //the loai
        for (const tag of $('div.genre-item', 'div.col-sm-10').toArray()) {
            const label = $(tag).text().trim();
            const id = $('span', tag).attr('data-id') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }
        //quoc gia
        for (const tag of $('option', 'select#country').toArray()) {
            const label = $(tag).text().trim();
            const id = 'country.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags2.push({ id: id, label: label });
        }
        //tinh trang
        for (const tag of $('option', 'select#status').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags3.push({ id: id, label: label });
        }
        //so luong chuong
        for (const tag of $('option', 'select#minchapter').toArray()) {
            const label = $(tag).text().trim();
            const id = 'minchapter.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags4.push({ id: id, label: label });
        }
        //sap xep
        for (const tag of $('option', 'select#sort').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags5.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại Truyện', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Quốc Gia (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Số Lượng Chương (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Sắp xếp (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        const request = createRequestObject({
            url: DOMAIN,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const returnObject = parseUpdatedManga($, time, ids)
        mangaUpdatesFoundCallback(createMangaUpdates(returnObject))
    }
}
