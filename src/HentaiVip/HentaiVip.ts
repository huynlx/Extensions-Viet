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

import { parseSearch, parseViewMore, isLastPage } from "./HentaiVipParser"

const method = 'GET'

export const HentaiVipInfo: SourceInfo = {
    version: '1.0.0',
    name: 'HentaiVip',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVip',
    websiteBaseURL: `https://hentaivn.vip/`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class HentaiVip extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = $('.author > i > a').text().trim();
        let status = $('.tsinfo  > .imptdt:first-child > i').text().trim(); //completed, 1 = Ongoing
        let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        let desc = $(".comic-description > .inner").text().trim();
        for (const t of $('.genre > a').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        const image = $('.comic-info .book > img').attr('src') ?? "";
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.info > h1').text().trim()],
            image: image,
            status: statusFinal,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: true,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${mangaId}`,
            method,
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $('.bixbox > .chap-list > .d-flex ').toArray().reverse()) {
            i++;
            let id = $('a', obj).first().attr('href');
            let name = $('a > span:first-child', obj).text().trim();
            let cc = $('a > span:first-child', obj).text().trim();
            let chapNum = Number(cc.includes('Chapter') ? cc.split('Chapter')[1].trim() : 'cc');
            let time = $('a > span:last-child', obj).text().trim().split('/');
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: isNaN(chapNum) ? i : chapNum,
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
        const pages: string[] = [];
        for (let obj of $('.content-text img').toArray()) {
            let link = $(obj).attr('src') ?? "";
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
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Truyện Hentai Đề Cử",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện Hentai Mới",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Hentai Hot",
            view_more: true,
        });


        //Load empty sections
        sectionCallback(view);
        sectionCallback(newUpdated);
        sectionCallback(hot);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: 'https://hentaivn.vip/truyen-hentai-moi/',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('div.col-6', '.form-row').toArray().splice(0, 20)) {
            let title = $('.entry > a', element).last().text().trim();
            let image = $('.entry > a > img', element).attr('src') ?? "";
            let id = $('.entry > a', element).first().attr('href');
            let subtitle = $(`.date-time`, element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //hot
        request = createRequestObject({
            url: 'https://hentaivn.vip/truyen-hot/truyen-hot-nam/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('div.col-6', '.form-row').toArray().splice(0, 20)) {
            let title = $('.entry > a', element).last().text().trim();
            let image = $('.entry > a > img', element).attr('src') ?? "";
            let id = $('.entry > a', element).first().attr('href');
            let subtitle = $(`.date-time`, element).text().trim();
            hotItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //đề cử
        request = createRequestObject({
            url: 'https://hentaivn.vip/',
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.entry ', '#girl .comics').toArray()) {
            let title = $('.name', element).text().trim();
            let image = $('a > img', element).attr('src') ?? "";
            let id = $('a', element).first().attr('href');
            let subtitle = $(`.date-time`, element).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://hentaivn.vip/truyen-hentai-moi/page/${page}/`;
                select = 1;
                break;
            case "hot":
                url = `https://hentaivn.vip/truyen-hot/truyen-hot-nam/page/${page}/`;
                select = 2;
                break;
            // case "view":
            //     url = `https://vlogtruyen.net/de-nghi/pho-bien/xem-nhieu?page=${page}`;
            //     select = 3;
            //     break;
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
        const request = createRequestObject({
            url: query.title ? encodeURI(`https://hentaivn.vip/truyen-hentai-moi/page/${page}/?q=${query.title}`) :
                tags[0] + `page/${page}/`,
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($);

        metadata = { page: page + 1 };

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const url = `https://hentaivn.vip/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.genre a').toArray()) {
            const label = $(tag).text().trim();
            const id = $(tag).attr('href');
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://hentaivn.vip/'
        }
    }
}