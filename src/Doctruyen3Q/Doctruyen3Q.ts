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
    LanguageCode
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage } from "./Doctruyen3QParser"

const DOMAIN = 'https://doctruyen3q.com/'
const method = 'GET'

export const Doctruyen3QInfo: SourceInfo = {
    version: '2.0.0',
    name: 'Doctruyen3Q',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Doctruyen3Q',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Doctruyen3Q extends Source {
    protected convertTime(timeAgo: string): Date {
        let time: Date
        let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0])
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed
        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
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
            time = new Date(Date.now() - trimmed * 31556952000)
        } else {
            if (timeAgo.includes(":")) {
                let split = timeAgo.split(' ');
                let H = split[0]; //vd => 21:08
                let D = split[1]; //vd => 25/08 
                let fixD = D.split('/');
                let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
                time = new Date(finalD + ' ' + H);
            } else {
                let split = timeAgo.split('-'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + split[2]);
            }
        }
        return time
    }
    getMangaShareUrl(mangaId: string): string { return mangaId };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
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
        creator = $('.info-detail-comic > .author > .detail-info').text().trim();
        for (const t of $('.info-detail-comic > .category > .detail-info > a').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        let status = $('.info-detail-comic > .status > .detail-info > span').text().trim(); //completed, 1 = Ongoing
        statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        let desc = $(".summary-content > p").text();
        const image = $('.image-info img').attr("src") ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.title-manga').text().trim()],
            image,
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
        for (const obj of $('#list-chapter-dt > nav > ul > li:not(:first-child)').toArray()) {
            let id = $('.chapters > a', obj).attr('href');
            let chapNum = parseFloat($('.chapters > a', obj).text()?.split(' ')[1]);
            let name = $('.chapters > a', obj).text().trim();
            let time = $('div:nth-child(2)', obj).text().trim();
            // let H = time[0];
            // let D = time[1].split('/');
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: chapNum,
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: this.convertTime(time)
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
        for (let obj of $('.list-image-detail img').toArray()) {
            let link = $(obj).attr('data-original') ?? $(obj).attr('src');
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
            title: "Truyện mới cập nhật",
            view_more: true,
        });
        let boy: HomeSection = createHomeSection({
            id: 'boy',
            title: "Truyện Tranh Con Trai",
            view_more: true,
        });
        let girl: HomeSection = createHomeSection({
            id: 'girl',
            title: "Truyện Tranh Con Gái ",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(featured);
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(boy);
        sectionCallback(girl);

        ///Get the section data
        //featured
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (const element of $('.owl-carousel .slide-item').toArray()) {
            let title = $('.slide-info > h3 > a', element).text().trim();
            let img = $('a > img', element).attr("data-src") ?? $('a > img', element).attr("src");
            let id = $('.slide-info > h3 > a', element).attr('href') ?? title;
            let subtitle = $(".detail-slide > a", element).text().trim();
            featuredItems.push(createMangaTile(<MangaTile>{
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        // Hot
        request = createRequestObject({
            url: 'https://doctruyen3q.com/hot',
            method: "GET",
        });
        let popular: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('#hot > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            popular.push(createMangaTile(<MangaTile>{
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        //update
        request = createRequestObject({
            url: 'https://doctruyen3q.com/',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('#home > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //boy
        request = createRequestObject({
            url: 'https://doctruyen3q.com/truyen-con-trai',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        let boyItems: MangaTile[] = [];
        for (const element of $('#male-comics > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            boyItems.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        boy.items = boyItems;
        sectionCallback(boy);

        //girl
        request = createRequestObject({
            url: 'https://doctruyen3q.com/truyen-con-gai',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        let girlItems: MangaTile[] = [];
        for (const element of $('#female-comics > .body > .main-left .item-manga > .item').toArray().splice(0, 20)) {
            let title = $('.caption > h3 > a', element).text().trim();
            let img = $('.image-item > a > img', element).attr("data-original") ?? $('.image-item > a > img', element).attr('src');
            let id = $('.caption > h3 > a', element).attr('href') ?? title;
            let subtitle = $("ul > li:first-child > a", element).text().trim();
            girlItems.push(createMangaTile({
                id: id ?? "",
                image: img ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        girl.items = girlItems;
        sectionCallback(girl);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        switch (homepageSectionId) {
            case "hot":
                url = `https://doctruyen3q.com/hot?page=${page}`;
                break;
            case "new_updated":
                url = `https://doctruyen3q.com/?page=${page}`;
                break;
            case "boy":
                url = `https://doctruyen3q.com/truyen-con-trai?page=${page}`;
                break;
            case "girl":
                url = `https://doctruyen3q.com/truyen-con-gai?page=${page}`;
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
        let manga = parseViewMore($, homepageSectionId);
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
            cate: '',
            status: "2", //tat ca
            sort: "1" //ngay cap nhat
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
            url: encodeURI(`https://doctruyen3q.com/tim-truyen/${search.cate}?keyword=${query.title ?? ""}&sort=${search.sort}&status=${search.status}&page=${page}`),
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
        const tags2: Tag[] = [];
        const tags5: Tag[] = [];

        const url = 'https://doctruyen3q.com/tim-truyen'
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.categories-detail li:not(.active) > a').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('href').split('/').pop();
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        //trang thai
        for (const tag of $('#status-comic a').toArray()) {
            var label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('href').split('=')[1];
            if (!id || !label) continue;
            tags5.push({ id: id, label: label });
        }

        //sap xep theo
        for (const tag of $('.list-select > a').toArray()) {
            var label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('href').split('=')[1];
            if (!id || !label) continue;
            tags2.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags2.map(x => createTag(x)) }),

            // createTagSection({ id: '5', label: 'Nhóm dịch', tags: tags6.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    override globalRequestHeaders(): RequestHeaders {
        return {
            referer: DOMAIN
        }
    }

    // override getCloudflareBypassRequest(): Request {
    //     return createRequestObject({ //https://lxhentai.com/
    //         url: 'https://manhuarock.net/',
    //         method: 'GET',
    //     }) //dit buoi lam lxhentai nua dkm, ti fix thanh medoctruyen
    // }
}