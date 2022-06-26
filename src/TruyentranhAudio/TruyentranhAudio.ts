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
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, isLastPage, parseViewMore, convertTime } from "./TruyentranhAudioParser"

const DOMAIN = 'https://truyentranhaudio.online/'
const method = 'GET'

export const TruyentranhAudioInfo: SourceInfo = {
    version: '1.0.1',
    name: 'TruyentranhAudio',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyentranhAudio',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class TruyentranhAudio extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}${mangaId}` };
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
        const request = createRequestObject({
            url: DOMAIN + mangaId, //ex:https://truyentranhaudio.online/truyen-vo-luyen-dinh-phong.html
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        let tags: Tag[] = [];
        const genres = [];
        let status = 1;
        let desc = $('.summary-content > p').text();
        for (const t of $('a', '.manga-info > li:nth-of-type(3)').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href')?.trim() ?? genre
            tags.push(createTag({ label: genre, id }));
            genres.push(
                {
                    label: genre,
                    id
                }
            );
        }
        const image = $('.info-cover > .thumbnail').attr('src') ?? "fuck";
        const creator = $('a', '.manga-info > li:nth-of-type(2)').text();

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [$('.manga-info > h3').text()],
            image: image.includes('http') ? image : 'https:' + image,
            status,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: DOMAIN + mangaId,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(response.rawData)).toString()
        const $ = this.cheerio.load(html);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".list-chapters > li").toArray().reverse()) {
            var chapNum = parseFloat($('a > .chapter-name', obj).text().split(' ')[1]);
            i++;
            chapters.push(createChapter(<Chapter>{
                id: $('a', obj).attr('href'),
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: $('a', obj).attr('title'),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: convertTime($('.chapter-time', obj).text().trim()),
                group: $('.chapter-view', obj).text().trim()
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}${chapterId}`,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('.chapter-content > img').toArray()) {
            if (!obj.attribs['data-src']) continue;
            let link = obj.attribs['data-src'].trim();
            if (link.includes("https://blogger.googleusercontent.com")) {
                link = "https://images2-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&gadget=a&no_expand=1&resize_h=0&rewriteMime=image/*&url=" + link;
            } else {
                if (link.includes('http')) {
                    link = link;
                } else {
                    link = DOMAIN + link;
                }
            }
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
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "TRUYỆN HOT TRONG NGÀY",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "TRUYỆN MỚI ĐĂNG",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        // Hot
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let popular: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('.owl-item', '.owl-stage').toArray()) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.thumb-wrapper > a', manga).attr('href');
            const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).css('background-image') ?? "";
            const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
            const sub = $('.chapter-title > a', manga).text().trim()
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: bg?.includes('http') ? (bg) : ("https:" + bg),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        //New Updates
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-lg-8.col-sm-8 > .card:nth-child(2) .row-last-update').toArray().splice(0, 15)) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.series-title > a', manga).attr('href') ?? title;
            const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).attr('data-bg');
            const sub = $('a', manga).last().text().trim();
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image?.includes('http') ? (image) : ("https:" + image),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //New Added
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-lg-8.col-sm-8 > .card:nth-child(5) .row-last-update').toArray()) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.series-title > a', manga).attr('href') ?? title;
            const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).attr('data-bg');
            const sub = $('a', manga).last().text().trim();
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: image?.includes('http') ? (image) : ("https:" + image),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
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
                url = DOMAIN + `manga-list.html?page=${page}`;
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
            url: query.title ? encodeURI(`${DOMAIN}danh-sach-truyen.html?name=${query.title}&page=${page}`) : `${DOMAIN}${tags[0]}?page=${page}`,
            method: "GET",
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
        const url = DOMAIN
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        const collectedIds: string[] = [];
        //the loai
        for (const tag of $('div:not(:last-child) ul.nav', '.megamenu > li').toArray()) {
            for (const gen of $('a', tag).toArray()) {
                const label = $(gen).text().trim();
                const id = $(gen).attr('href') ?? label;
                if (!id || !label) continue;
                if (!collectedIds.includes(id)) {
                    arrayTags.push({ id: id, label: label });
                    collectedIds.push(id);
                }
            }
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}