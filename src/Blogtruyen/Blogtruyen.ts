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
import { parseSearch, isLastPage, parseViewMore } from "./BlogtruyenParser"

const DOMAIN = 'https://truyentranhlh.net/'
const method = 'GET'

export const BlogtruyenInfo: SourceInfo = {
    version: '2.0.0',
    name: 'Blogtruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Blogtruyen',
    websiteBaseURL: `https://blogtruyen.vn`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Blogtruyen extends Source {
    getMangaShareUrl(mangaId: string): string { return `https://blogtruyen.vn${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `https://blogtruyen.vn${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.content > p').text();
        for (const t of $('.description > p:nth-child(3) > .category > a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        creator = $('.description > p:nth-child(1) > a').text();
        status = $('.description > p:nth-child(4) > .color-red').text().toLowerCase().includes("đang") ? 1 : 0;
        const image = $('.thumbnail > img').attr('src') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.entry-title > a').text().trim()],
            image: encodeURI(image),
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `https://blogtruyen.vn${mangaId}`,
            method,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $("#list-chapters > p").toArray().reverse()) {
            i++;
            const getTime = $('.publishedDate', obj).text().trim().split(' ');
            const time = {
                date: getTime[0],
                time: getTime[1]
            }
            const arrDate = time.date.split(/\//);
            const fixDate = [arrDate[1], arrDate[0], arrDate[2]].join('/');
            const finalTime = new Date(fixDate + ' ' + time.time);
            chapters.push(createChapter(<Chapter>{
                id: $('span.title > a', obj).first().attr('href'),
                chapNum: i,
                name: $('span.title > a', obj).text().trim(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: finalTime
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `https://blogtruyen.vn${chapterId}`,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('#content > img').toArray()) {
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
            title: "Top All",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện mới cập nhật",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện mới đăng",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        //Featured
        let url = `${DOMAIN}`
        let request = createRequestObject({
            url: 'https://blogtruyen.vn/thumb',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let featuredItems: MangaTile[] = [];

        for (let manga of $('a', 'div#storyPinked').toArray()) {
            const title = $('p:first-child', $(manga).next()).text().trim();
            const id = $(manga).attr('href');
            const image = $('img', manga).attr('src')?.replace('182_182', '400') ?? "";
            const subtitle = $('p:last-child', $(manga).next()).text().trim();
            if (!id || !title) continue;
            featuredItems.push(createMangaTile({
                id: id,
                image: encodeURI(image),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //Hot
        url = '';
        request = createRequestObject({
            url: 'https://blogtruyen.vn/ajax/Search/AjaxLoadListManga?key=tatca&orderBy=3&p=1',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('p:not(:first-child)', '.list').toArray()) {
            let title = $(`a`, obj).text().trim();
            let subtitle = 'Chương ' + $(`span:nth-child(2)`, obj).text().trim();
            const image = $('img', $(obj).next()).attr('src') ?? "";
            let id = $(`a`, obj).attr('href') ?? title;
            hotItems.push(createMangaTile({
                id: id,
                image: encodeURI(image.replace('150', '200')),
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
            url: 'https://blogtruyen.vn/thumb',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.row', '.list-mainpage .storyitem').toArray().splice(0, 20)) {
            let title = $(`h3.title > a`, obj).text().trim();
            let subtitle = $(`div:nth-child(2) > div:nth-child(4) > span:nth-child(1) > .color-red`, obj).text();
            const image = $(`div:nth-child(1) > a > img`, obj).attr('src');
            let id = $(`div:nth-child(1) > a`, obj).attr('href') ?? title;
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('150_150', '200')),
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: 'Chương ' + subtitle,
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //New Added
        url = DOMAIN
        request = createRequestObject({
            url: 'https://blogtruyen.vn/thumb',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('a', '#top-newest-story').toArray()) {
            let title = $(obj).attr('title')?.trim() ?? "";
            // let subtitle = $(`.info-bottom > span`, obj).text().split(":")[0].trim();
            const image = $(`img`, obj).attr('src');
            let id = $(obj).attr("href") ?? title;
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image.replace('86_86', '200')),
                title: createIconText({
                    text: title,
                })
                // subtitleText: createIconText({
                //     text: subtitle,
                // }),
            }))
        }
        newAdded.items = newAddItems;
        sectionCallback(newAdded);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "hot":
                url = `https://blogtruyen.vn/ajax/Search/AjaxLoadListManga?key=tatca&orderBy=3&p=${page}`;
                select = 0;
                break;
            case "new_updated":
                url = `https://blogtruyen.vn/thumb-${page}`;
                select = 1;
                break;
            // case "new_added":
            //     url = `https://sayhentai.net/danh-sach-truyen.html?status=0&sort=id&page=${page}`;
            //     select = 1;
            //     break;
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

        const manga = parseViewMore($, select);
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
            url: encodeURI(`https://blogtruyen.vn/timkiem/nangcao/1/0/${tags[0] ? tags[0] : '-1'}/-1?txt=${query.title ? query.title : ''}`),
            method: "GET",
            param: encodeURI(`&p=${page}`)
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
        const url = `https://blogtruyen.vn/timkiem/nangcao`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        //the loai
        for (const tag of $('li', '.list-unstyled.row').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('data-id') ?? label;
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://blogtruyen.vn/'
        }
    }
}