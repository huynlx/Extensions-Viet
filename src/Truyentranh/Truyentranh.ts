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
    LanguageCode
} from "paperback-extensions-common"

import { parseSearch, isLastPage, parseViewMore, convertTime } from "./TruyentranhParser"

const DOMAIN = 'https://truyentranh.net/'
const method = 'GET'

export const TruyentranhInfo: SourceInfo = {
    version: '1.0.0',
    name: 'Truyentranh',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyentranh',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Truyentranh extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: mangaId, 
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        // let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let status = 1;
        let desc = $('.detail-manga-intro').text();
        for (const t of $('.detail-manga-category a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href')?.trim() ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        const image = $('.detail-img').attr('data-image-full') ?? "fuck";
        const creator = $('.detail-banner-info ul li:nth-child(3) > a > span').text();

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [$('.detail-manga-title > h1').text()],
            image: image,
            status,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: mangaId,
            method,
        });
        var i = 0;
        const response = await this.requestManager.schedule(request, 1);
        // let html = Buffer.from(createByteArray(response.rawData)).toString()
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        for (const obj of $(".chapter-list-item-box").toArray().reverse()) {
            i++;
            var chapNum = parseFloat($('.chapter-select > a', obj).text().split(' ')[1]);
            var time = $('.chapter-info > time', obj).text().trim().split(', ');
            var d = time[0].split('/');
            var t = time[1];
            chapters.push(createChapter(<Chapter>{
                id: $('.chapter-select > a', obj).attr('href'),
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: $('.chapter-select > a', obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(d[1] + '/' + d[0] + '/' + d[2] + ' ' + t)
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
        for (let obj of $('.manga-reading-box > .page-chapter > img').toArray()) {
            if (!obj.attribs['src']) continue;
            let link = obj.attribs['src'].trim();
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
            title: "DÀNH CHO BẠN",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "MỚI CẬP NHẬT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "TÁC PHẨM MỚI",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(newAdded);
        sectionCallback(hot);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: 'https://truyentranh.net/comic',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('.content .card-list > .card').toArray()) {
            const title = $('.card-title', manga).text().trim();
            const id = $('.card-title > a', manga).attr('href') ?? title;
            const image = $('.card-img', manga).attr('src');
            const sub = $('.list-chapter > li:first-child > a', manga).text().trim();
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image,
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
            url: 'https://truyentranh.net/comic-latest',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.content .card-list > .card').toArray()) {
            const title = $('.card-title', manga).text().trim();
            const id = $('.card-title > a', manga).attr('href') ?? title;
            const image = $('.card-img', manga).attr('src');
            const sub = $('.list-chapter > li:first-child > a', manga).text().trim();
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: image,
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

        // Hot
        request = createRequestObject({
            url: 'https://truyentranh.net',
            method: "GET",
        });
        let popular: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('#bottomslider .list-slider-item').toArray()) {
            const title = $('.card', manga).attr('title');
            const id = $('.card', manga).attr('href');
            const image = $('.card-img', manga).attr('src');
            const sub = $('.card-chapter', manga).text().trim()
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://truyentranh.net/comic?page=${page}`;
                break;
            case "new_added":
                url = `https://truyentranh.net/comic-latest?page=${page}`;
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
            url: query.title ? encodeURI(`https://truyentranh.net/search?page=${page}&q=${query.title}`) : `${tags[0]}?page=${page}`,
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
        for (const tag of $('.dropdown-menu > ul > li > a').toArray()) {
            arrayTags.push({ id: $(tag).attr('href'), label: $(tag).text().trim() });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: `${DOMAIN}`
        }
    }
}