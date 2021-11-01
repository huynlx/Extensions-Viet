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
import { parseSearch, isLastPage, parseViewMore, decodeHTMLEntity } from "./TruyentranhLHParser"

const DOMAIN = 'https://truyentranhlh.net/'
const method = 'GET'

export const TruyentranhLHInfo: SourceInfo = {
    version: '2.0.0',
    name: 'TruyentranhLH',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyentranhLH',
    websiteBaseURL: `https://truyentranhlh.net/`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class TruyentranhLH extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}truyen-tranh/${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
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
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.summary-content > p').text();

        for (const test of $('.info-item', '.series-information').toArray()) {
            switch ($('.info-name', test).text().trim()) {
                case 'Tác giả:':
                    creator = $('.info-value', test).text();
                    break;
                case 'Thể loại:':
                    for (const t of $('.info-value > a', test).toArray()) {
                        const genre = $('span', t).text().trim()
                        const id = $(t).attr('href') ?? genre
                        tags.push(createTag({ label: genre, id }));
                    }
                    break;
                case 'Tình trạng:':
                    status = $('.info-value > a', test).text().toLowerCase().includes("đang tiến hành") ? 1 : 0;
                    break;
                default:
                    break;
            }
        }
        const image = $('.top-part > .row > .col-12 > .series-cover > .a6-ratio > div').css('background-image');
        const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($('.series-name > a').text().trim())],
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : bg,
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
        var i = 0;
        for (const obj of $(".list-chapters.at-series > a").toArray().reverse()) {
            var chapNum = parseFloat($('li > .chapter-name', obj).text().trim().split(' ')[1]);
            i++;
            const timeStr = $('li > .chapter-time', obj).text().trim().split(/\//);
            const time = new Date([timeStr[1], timeStr[0], timeStr[2]].join('/'));
            chapters.push(createChapter(<Chapter>{
                id: $(obj).first().attr('href'),
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: decodeHTMLEntity($('li > .chapter-name', obj).text()),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time
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
        for (let obj of $('#chapter-content > img').toArray()) {
            if (!obj.attribs['data-src']) continue;
            let link = obj.attribs['data-src'];
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
            title: "Truyện hot trong ngày",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện mới cập nhật",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện mới nhất",
            view_more: true,
        });

        //Load empty sections
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
        for (let obj of $('.owl-item', '.owl-stage').toArray()) {
            let title = $(`.series-title > a`, obj).text().trim();
            let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
            const image = $(`.a6-ratio > div.img-in-ratio`, obj).css('background-image');
            const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            let id = $(`.series-title > a`, obj).attr("href")?.split("/").pop() ?? title;
            // if (!id || !subtitle) continue;
            hotItems.push(createMangaTile({
                id: id,
                image: bg ?? "",
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
            url: DOMAIN,
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(1) > .card-body > .row').toArray().splice(0, 20)) {
            let title = $(`.series-title > a`, obj).text().trim();
            let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
            const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
            let id = $(`.series-title > a`, obj).attr("href")?.split("/").pop() ?? title;
            // if (!id || !subtitle) continue;
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

        //New Added
        url = DOMAIN
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(2) > .card-body > .row').toArray().splice(0, 20)) {
            let title = $(`.series-title > a`, obj).text().trim();
            let subtitle = $(`.thumb-detail > div > a`, obj).text().trim();
            const image = $(`.a6-ratio > div.img-in-ratio`, obj).attr('data-bg');
            let id = $(`.series-title > a`, obj).attr("href")?.split("/").pop() ?? title;
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
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
        newAdded.items = newAddItems;
        sectionCallback(newAdded);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}danh-sach?sort=update&page=${page}`;
                break;
            case "new_added":
                url = `${DOMAIN}danh-sach?sort=new&page=${page}`;
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
            status: "",
            sort: "update",
            genres: "",
        };

        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const category: string[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                category.push(value)
            } else {
                switch (value.split(".")[0]) {
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break
                }
            }
        })
        search.genres = (category ?? []).join(",");
        const request = createRequestObject({
            url: `${DOMAIN}tim-kiem`,
            method: "GET",
            param: encodeURI(`?q=${query.title ?? ''}&status=${search.status}&sort=${search.sort}&accept_genres=${search.genres}&page=${page}`)
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
        const url = `${DOMAIN}tim-kiem`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        const arrayTags2: Tag[] = [
            {
                label: 'Tất cả',
                id: 'status.'
            },
            {
                label: 'Đang tiến hành',
                id: 'status.1'
            },
            {
                label: 'Tạm ngưng',
                id: 'status.2'
            },
            {
                label: 'Hoàn thành',
                id: 'status.3'
            }
        ];
        const arrayTags3: Tag[] = [];
        //the loai
        for (const tag of $('div.search-gerne_item', 'div.form-group').toArray()) {
            const label = $('.gerne-name', tag).text().trim();
            const id = $('label', tag).attr('data-genre-id') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }
        //sap xep
        for (const tag of $('option', 'select#list-sort').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags3.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Tình trạng', tags: arrayTags2.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Sắp xếp', tags: arrayTags3.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: DOMAIN
        }
    }
}