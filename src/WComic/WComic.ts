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
} from "paperback-extensions-common"
import { parseSearch, isLastPage, parseViewMore, convertTime } from "./WComicParser"

const DOMAIN = 'https://wcomic.site/'
const method = 'GET'

export const WComicInfo: SourceInfo = {
    version: '1.0.0',
    name: 'WComic',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from WComic',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class WComic extends Source {
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
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $('.desc').text().replace('Nội dung', '').trim();
        for (const t of $('.list_cate a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        creator = '';
        status = $('.status > div').last().text().toLowerCase().includes("đang") ? 1 : 0;
        const image = $('.first > img').attr('src');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.heading_comic').text().trim()],
            image: image,
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${mangaId}`,
            method,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".list_item_chap > a").toArray().reverse()) {
            var chapNum = parseFloat($('span', obj).first().text().trim());
            i++;
            chapters.push(createChapter(<Chapter>{
                id: $(obj).attr('href'),
                chapNum: chapNum,
                name: '',
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: convertTime($('span', obj).last().text().trim())
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
        for (let obj of $('.list_img_chap > img').toArray()) {
            if (!obj.attribs['data-src']) continue;
            let link = obj.attribs['data-src'].includes('http') ?
                (obj.attribs['data-src']).trim() : (DOMAIN + obj.attribs['data-src']).trim();
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
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện mới cập nhập",
            view_more: true,
        });


        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);

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
        for (let obj of $('.owl-carousel > div').toArray()) {
            let title = $(`.name`, obj).text().trim();
            let subtitle = $(`.chap_newest`, obj).text().trim() + ' | ' + $('.time_update', obj).text().trim();
            const image = $(`img`, obj).attr('src');
            let id = $(`a`, obj).first().attr("href") ?? title;
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

        //New Updates
        url = '';
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let obj of $('.wc_comic_list > .wc_item').toArray()) {
            let title = $(`a`, obj).first().attr('title');
            let subtitle = $(`.row_one > span:first-child`, obj).text().trim();
            const image = $(`a:first-child img`, obj).attr('src');
            let id = $(`a:first-child`, obj).attr('href');
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
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}truyen-moi-cap-nhap/trang-${page}.html`;
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
            cate: "",
            status: "",
            rating: "",
            min: ""
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
                    break
                case 'status':
                    search.status = (value.split(".")[1]);
                    break
                case 'rating':
                    search.rating = (value.split(".")[1]);
                    break
                case 'min':
                    search.min = (value.split(".")[1]);
                    break
            }
        })

        const request = createRequestObject({
            url: (query.title ? encodeURI(`${DOMAIN}tim-kiem/${query.title}/trang-${page}.html`) : encodeURI(`${DOMAIN}loc-truyen/cate-${search.cate}/status-${search.status}/rating-${search.rating}/minchap-${search.min}/trang-${page}.html`)),
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
        let url = `${DOMAIN}loc-truyen`;
        const request = createRequestObject({
            url,
            method
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const tags: Tag[] = [
        ];
        const tags1: Tag[] = [
        ]
        const tags2: Tag[] = [
        ]
        const tags3: Tag[] = [
        ]
        //the loai
        for (const tag of $('.checkbox_form > div').toArray()) {
            const label = $('label', tag).text().trim();
            const id = 'cate.' + $('input', tag).attr('value');
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }

        //tinh trang
        for (const tag of $('select[name="status_filter"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags1.push({ id: id, label: label });
        }

        //diem
        for (const tag of $('select[name="rating_filter"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'rating.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags2.push({ id: id, label: label });
        }

        //chap
        for (const tag of $('select[name="minchap_filter"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'min.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags3.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Tình Trạng', tags: tags1.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Điểm', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Tổng Chap', tags: tags3.map(x => createTag(x)) })
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: DOMAIN
        }
    }
}