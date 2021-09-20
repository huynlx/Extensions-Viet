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
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore } from "./BeengParser"

const DOMAIN = 'https://beeng.org/'
const method = 'GET'

export const BeengInfo: SourceInfo = {
    version: '2.0.0',
    name: 'Beeng',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Beeng',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Beeng extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 2,
        requestTimeout: 10000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${DOMAIN}${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = [];
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.shortDetail').text();
        for (const t of $('.list-cate > a').toArray()) {
            const genre = $('li', t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }

        const test = $('.aboutThisComic > li:nth-child(2) > a').text();
        for (const obj of $('.aboutThisComic > li:nth-child(2) > a').toArray()) {
            creator.push($(obj).text().trim())
        };

        // status = $('.info-item:nth-child(4) > .info-value > a').text().toLowerCase().includes("đang tiến hành") ? 1 : 0;
        const image = $('.cover > img').attr('data-src');
        return createManga({
            id: mangaId,
            author: !test ? $('.aboutThisComic > li:nth-child(2)').children().remove().end().text() : creator.join(', '),
            artist: !test ? $('.aboutThisComic > li:nth-child(2)').children().remove().end().text() : creator.join(', '),
            desc,
            titles: [$('.detail > h1').text().trim()],
            image: image ?? "https://i.imgur.com/GYUxEX8.png",
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${DOMAIN}${mangaId}`,
            method,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $("#scrollbar a").toArray().reverse()) {
            i++;
            const getTime = $('span.name > span.views', obj).text().trim().split(' ');
            const time = {
                date: getTime[0],
                time: getTime[1].split('-')[0].trim()
            }
            const arrDate = time.date.split(/\-/);
            const fixDate = [arrDate[1], arrDate[0], arrDate[2]].join('/');
            const finalTime = new Date(fixDate + ' ' + time.time);
            chapters.push(createChapter(<Chapter>{
                id: $(obj).attr('href'),
                chapNum: i,
                name: $('span.name > span.titleComic', obj).text().trim(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: finalTime
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
        for (let obj of $('#lightgallery2 > img').toArray()) {
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
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "ĐANG HOT",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "MỚI NHẤT",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "XEM NHIỀU",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);

        ///Get the section data
        //Hot
        let url = '';
        let request = createRequestObject({
            url: `${DOMAIN}danh-muc/dang-hot`,
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray().splice(0, 40)) {
            let title = $(`.detail > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapters a`, obj).attr('title');
            const image = $(`.cover img`, obj).attr('data-src');
            let id = $(`.detail > h3 > a`, obj).attr("href")?.split("/").pop() ?? title;
            if (!id || !subtitle) continue;
            hotItems.push(createMangaTile({
                id: id,
                image: image ?? "",
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

        //New Updates
        url = '';
        request = createRequestObject({
            url: `${DOMAIN}the-loai?cate=&author=&translater=&complete=&sort=lastest`,
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray().splice(0, 40)) {
            let title = $(`.detail > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapters a`, obj).attr('title');
            const image = $(`.cover img`, obj).attr('data-src');
            let id = $(`.detail > h3 > a`, obj).attr("href")?.split("/").pop() ?? title;
            if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image ?? "",
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

        //view
        url = DOMAIN
        request = createRequestObject({
            url: `${DOMAIN}the-loai?cate=&author=&translater=&complete=&sort=view`,
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('li', '.mainContent > .content > .listComic > ul.list').toArray().splice(0, 40)) {
            let title = $(`.detail > h3 > a`, obj).text().trim();
            let subtitle = $(`.chapters a`, obj).attr('title');
            const image = $(`.cover img`, obj).attr('data-src');
            let id = $(`.detail > h3 > a`, obj).attr("href")?.split("/").pop() ?? title;
            if (!id || !subtitle) continue;
            viewItems.push(createMangaTile({
                id: id,
                image: image ?? "",
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: subtitle,
                }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "hot":
                url = `${DOMAIN}danh-muc/dang-hot?page=${page}`;
                break;
            case "new_updated":
                url = `${DOMAIN}the-loai?cate=&author=&translater=&complete=&sort=lastest&page=${page}`;
                break;
            case "view":
                url = `${DOMAIN}the-loai?cate=&author=&translater=&complete=&sort=view&page=${page}`;
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
            cate: "",
            author: "",
            translater: "",
            complete: "",
            sort: ""
        };
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
                    break
                case 'author':
                    search.author = (value.split(".")[1]);
                    break
                case 'translater':
                    search.translater = (value.split(".")[1]);
                    break
                case 'complete':
                    search.complete = (value.split(".")[1]);
                    break
                case 'sort':
                    search.sort = (value.split(".")[1]);
                    break
            }
        })
        const request = createRequestObject({
            url: query.title ? encodeURI(`${DOMAIN}tim-kiem?q=${query.title ?? ''}`) : `${DOMAIN}the-loai?cate=${search.cate}&author=${search.author}&translater=${search.translater}&complete=${search.complete}&sort=${search.sort}`,
            method: "GET",
            param: `&page=${page}`
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
        const url = `${DOMAIN}the-loai`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        const arrayTags2: Tag[] = [];
        // const arrayTags3: Tag[] = [];
        const arrayTags4: Tag[] = [];
        const arrayTags5: Tag[] = [];
        //the loai
        for (const tag of $('option', '#formAdvance > .column-search:nth-child(1) > select').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }
        //tac gia
        for (const tag of $('option', '#formAdvance > .column-search:nth-child(2) > select').toArray()) {
            const label = $(tag).text().trim();
            const id = 'author.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags2.push({ id: id, label: label });
        }
        //nhom dich
        // for (const tag of $('option', '#formAdvance > .column-search:nth-child(3) > select').toArray()) {
        //     const label = $(tag).text().trim();
        //     const id = 'translater.' + $(tag).attr('value') ?? label;
        //     if (!id || !label) continue;
        //     arrayTags3.push({ id: id, label: label });
        // }

        //tinh trang
        for (const tag of $('option', '#formAdvance > .column-search:nth-child(4) > select').toArray()) {
            const label = $(tag).text().trim();
            const id = 'complete.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags4.push({ id: id, label: label });
        }

        //sap xep
        for (const tag of $('option', '#formAdvance > .column-search:nth-child(5) > select').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags5.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Tác giả', tags: arrayTags2.map(x => createTag(x)) }),
            // createTagSection({ id: '2', label: 'Nhóm dịch', tags: arrayTags3.map(x => createTag(x)) }), //lỗi crash
            createTagSection({ id: '3', label: 'Tình trạng', tags: arrayTags4.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Sắp xếp', tags: arrayTags5.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: DOMAIN
        }
    }
}