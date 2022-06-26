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
    RequestHeaders,
    MangaTile,
    Tag,
    LanguageCode,
    HomeSectionType,
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage, ChangeToSlug } from "./MeDocTruyenParser"

const method = 'GET'

export const MeDocTruyenInfo: SourceInfo = {
    version: '2.5.1',
    name: 'MeDocTruyen',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from MeDocTruyen',
    websiteBaseURL: `https://m.medoctruyentranh.net/`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class MeDocTruyen extends Source {
    getMangaShareUrl(mangaId: string): string { return (mangaId) };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': 'https://m.medoctruyentranh.net/'
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
        let creator = '';
        var info = $(".detail_infos");
        creator = $(".other_infos font", info).first().text();
        for (const t of $('.other_infos:nth-child(3) > div:nth-child(2) > a', info).toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        let status = $('.other_infos:nth-child(3) > div:nth-child(1) > font', info).text().includes('Đang') ? 1 : 0; //completed, 1 = Ongoing
        let desc = $(".summary", info).text();
        const image = $(".detail_info img").first().attr("src");
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.title', info).text().trim()],
            image: image,
            status: status,
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
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt?.props.pageProps.initialState.detail.story_chapters;
        for (const t of novels) {
            for (const v of t) {
                chapters.push(createChapter(<Chapter>{
                    id: mangaId + '/' + v.chapter_index,
                    chapNum: v.chapter_index,
                    name: 'Chapter ' + v.chapter_index,
                    mangaId: mangaId,
                    langCode: LanguageCode.VIETNAMESE,
                    time: new Date(v.time)
                }));
            }

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
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/)
        if (dt) dt = JSON.parse(dt[1]);
        const pages: string[] = [];
        dt.props.pageProps.initialState.read.detail_item.elements.forEach((v: any) => {
            pages.push(v.content);
        });

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
            title: "Cập nhật mới",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Tác phẩm mới",
            view_more: true,
        });
        let suggest: HomeSection = createHomeSection({
            id: 'suggest',
            title: "Đề xuất truyện mới",
            view_more: true,
        });
        let chapter: HomeSection = createHomeSection({
            id: 'chapter',
            title: "Truyện nhiều chương",
            view_more: true,
        });
        let artbook: HomeSection = createHomeSection({
            id: 'artbook',
            title: "Chuyên mục Artbook",
            view_more: true,
        });
        // let selected: HomeSection = createHomeSection({
        //     id: 'selected',
        //     title: "Nội dung chọn lọc",
        //     view_more: true,
        // });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(view);
        sectionCallback(suggest);
        sectionCallback(chapter);
        sectionCallback(artbook);
        // sectionCallback(selected);

        ///Get the section data
        //New Updates
        let request = createRequestObject({
            url: 'https://www.medoctruyentranh.net/',
            method: "GET",
        });
        let updateItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt.props.pageProps.initialState.home.list[1].items.splice(0, 10);
        var el = $('.home-main-left > .area-con:nth-child(1) > .story-list-box > .story-item').toArray();
        for (var i = 0; i < el.length; i++) {
            var e = el[i];
            updateItems.push(createMangaTile({
                id: $('a', e).first().attr('href'),
                image: novels[i].img_url,
                title: createIconText({ text: novels[i].title }),
                subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
            }))
        }
        newUpdated.items = updateItems;
        sectionCallback(newUpdated);

        //Featured
        request = createRequestObject({
            url: 'https://www.medoctruyentranh.net/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt.props.pageProps.initialState.home.list[0].items;
        novels.forEach((v: any) => {
            featuredItems.push(createMangaTile({
                id: 'https://www.medoctruyentranh.net/truyen-tranh/' + ChangeToSlug(v.title) + '-' + v.obj_id,
                image: v.img_url,
                title: createIconText({ text: v.title }),
                subtitleText: createIconText({ text: 'Chapter ' + v.newest_chapters[0].chapter_index }),
            }))
        })
        featured.items = featuredItems;
        sectionCallback(featured);

        //Just Added
        request = createRequestObject({
            url: 'https://www.medoctruyentranh.net/',
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt.props.pageProps.initialState.home.list[2].items.splice(0, 10);
        var el = $('.home-main-left > .area-con:nth-child(2) > .story-list-box > .story-item').toArray();
        for (var i = 0; i < el.length; i++) {
            var e = el[i];
            viewItems.push(createMangaTile({
                id: $('a', e).first().attr('href'),
                image: novels[i].img_url,
                title: createIconText({ text: novels[i].title }),
                subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);

        // Suggest
        request = createRequestObject({
            url: 'https://www.medoctruyentranh.net/',
            method: "GET",
        });
        let suggestItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt.props.pageProps.initialState.home.list[4].items.splice(0, 10);
        var el = $('.home-main-left > .area-con:nth-child(3) > .story-list-box > .story-item').toArray();
        for (var i = 0; i < el.length; i++) {
            var e = el[i];
            suggestItems.push(createMangaTile({
                id: $('a', e).first().attr('href'),
                image: novels[i].img_url,
                title: createIconText({ text: novels[i].title }),
                subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
            }))
        }
        suggest.items = suggestItems;
        sectionCallback(suggest);

        // chapter
        request = createRequestObject({
            url: 'https://www.medoctruyentranh.net/',
            method: "GET",
        });
        let chapterItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt.props.pageProps.initialState.home.list[8].items.splice(0, 10);
        var el = $('.home-main-left > .area-con:nth-child(4) > .story-list-box > .story-item').toArray();
        for (var i = 0; i < el.length; i++) {
            var e = el[i];
            chapterItems.push(createMangaTile({
                id: $('a', e).first().attr('href'),
                image: novels[i].img_url,
                title: createIconText({ text: novels[i].title }),
                subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
            }))
        }
        chapter.items = chapterItems;
        sectionCallback(chapter);

        // artbook
        request = createRequestObject({
            url: 'https://www.medoctruyentranh.net/',
            method: "GET",
        });
        let artbookItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        if (dt) dt = JSON.parse(dt[1]);
        var novels = dt.props.pageProps.initialState.home.list[11].items.splice(0, 10);
        var el = $('.home-main-left > .area-con:nth-child(5) > .story-list-box > .story-item').toArray();
        for (var i = 0; i < el.length; i++) {
            var e = el[i];
            artbookItems.push(createMangaTile({
                id: $('a', e).first().attr('href'),
                image: novels[i].img_url,
                title: createIconText({ text: novels[i].title }),
                subtitleText: createIconText({ text: 'Chapter ' + novels[i].newest_chapters[0].chapter_index }),
            }))
        }
        artbook.items = artbookItems;
        sectionCallback(artbook);

        // // selected
        // request = createRequestObject({
        //     url: 'https://www.medoctruyentranh.net/de-xuat/hay',
        //     method: "GET",
        // });
        // let selectedItems: MangaTile[] = [];
        // data = await this.requestManager.schedule(request, 1);
        // $ = this.cheerio.load(data.data);
        // var dt = $.html().match(/<script.*?type=\"application\/json\">(.*?)<\/script>/);
        // if (dt) dt = JSON.parse(dt[1]);
        // var novels = dt.props.pageProps.initialState.more.moreList.list;
        // var covers: any = [];
        // novels.forEach((v: any) => {
        //     covers.push({
        //         image: v.coverimg,
        //         title: v.title,
        //         chapter: v.newest_chapter_name
        //     })
        // })
        // var el = $('.morelistCon a').toArray();
        // for (var i = 0; i < 5; i++) {
        //     var e = el[i];
        //     selectedItems.push(createMangaTile(<MangaTile>{
        //         id: $(e).attr("href"), // e.attribs['href']
        //         image: covers[i].image,
        //         title: createIconText({ text: covers[i].title }),
        //         subtitleText: createIconText({ text: covers[i].chapter }),
        //     }));
        // }
        // selected.items = selectedItems;
        // sectionCallback(selected);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://www.medoctruyentranh.net/de-xuat/cap-nhat-moi/2`;
                break;
            case "view":
                url = `https://www.medoctruyentranh.net/de-xuat/tac-pham-moi/20`;
                break;
            case "suggest":
                url = `https://www.medoctruyentranh.net/de-xuat/de-xuat-truyen-moi/37`;
                break;
            case "chapter":
                url = `https://www.medoctruyentranh.net/de-xuat/truyen-nhieu-chuong/35`;
                break;
            case "artbook":
                url = `https://www.medoctruyentranh.net/de-xuat/chuyen-muc-artbook/36`;
                break;
            // case "selected":
            //     url = `https://www.medoctruyentranh.net/de-xuat/hay`;
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
        const search = {
            cate: 'toan-bo',
            status: "",
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
                    break
                case 'status':
                    search.status = (value.split(".")[1]);
                    break
            }
        })
        const request = createRequestObject({
            url: encodeURI(query.title ? `https://www.medoctruyentranh.net/search/${query.title}` : `https://www.medoctruyentranh.net/tim-truyen/${search.cate}/${page}?${search.status}`),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($, query);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const tags5: Tag[] = [];

        const url = `https://www.medoctruyentranh.net/tim-truyen/toan-bo`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.searchCon > .search:nth-child(1) > .right > a').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('href').split('/').pop();
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        //trang thai
        for (const tag of $('.searchCon > .search:nth-child(2) > .right > a').toArray()) {
            var label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('href').split('?').pop();
            if (!id || !label) continue;
            tags5.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}