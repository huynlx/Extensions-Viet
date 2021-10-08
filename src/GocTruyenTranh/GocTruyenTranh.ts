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
    // MangaTile,
    Tag,
    LanguageCode,
    // HomeSectionType
} from "paperback-extensions-common"
import { parseSearch, parseViewMore, decodeHTMLEntity, convertTime } from "./GocTruyenTranhParser"

const DOMAIN = 'https://goctruyentranh.com/'
const method = 'GET'

export const GocTruyenTranhInfo: SourceInfo = {
    version: '1.0.0',
    name: 'GocTruyenTranh',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from GocTruyenTranh',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class GocTruyenTranh extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId.split("::")[0]}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${mangaId.split("::")[0]}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //0 = completed, 1 = Ongoing
        let desc = $('.detail-section .description .content').text();

        creator = $('.detail-section .author')
            .clone()    //clone the element
            .children() //select all the children
            .remove()   //remove all the children
            .end()  //again go back to selected element
            .text();
        for (const t of $('.detail-section .category a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        status = $('.detail-section .status')
            .clone()    //clone the element
            .children() //select all the children
            .remove()   //remove all the children
            .end()  //again go back to selected element
            .text().includes('Đang') ? 1 : 0;
        const image = $('.detail-section .photo > img').attr('src');
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($('.detail-section .title > h1').text().trim())],
            image: encodeURI(image),
            status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> { //mangaId của getChapters là id trong createManga
        const request = createRequestObject({
            url: `https://goctruyentranh.com/api/comic/${mangaId.split("::")[1]}/chapter?offset=0&limit=-1`,
            method,
        });

        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const chapters: Chapter[] = [];
        for (const obj of json.result.chapters) {
            var chapNum = parseFloat(obj.numberChapter);
            const timeStr = obj.stringUpdateTime;
            chapters.push(createChapter(<Chapter>{
                id: mangaId.split('::')[0] + '/chuong-' + obj.numberChapter,
                chapNum: chapNum,
                name: obj.name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: convertTime(timeStr)
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
        for (let obj of $('.view-section > .viewer > img').toArray()) {
            if (!obj.attribs['src']) continue;
            let link = obj.attribs['src'];
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
        // let featured = createHomeSection({ id: 'featured', title: 'Tiêu điểm', type: HomeSectionType.featured });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Truyện Đề Xuất",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Cập Nhật Gần Đây",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện Mới",
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
            url: 'https://goctruyentranh.com/api/comic/search/view?p=0',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        hot.items = parseViewMore(json).splice(0, 10);
        sectionCallback(hot);

        //New Updates
        url = '';
        request = createRequestObject({
            url: 'https://goctruyentranh.com/api/comic/search/recent?p=0',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        newUpdated.items = parseViewMore(json).splice(0, 10);
        sectionCallback(newUpdated);

        //New Added
        url = DOMAIN
        request = createRequestObject({
            url: 'https://goctruyentranh.com/api/comic/search/new?p=0',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        newAdded.items = parseViewMore(json).splice(0, 10);
        sectionCallback(newAdded);

        // //Featured
        // url = '';
        // request = createRequestObject({
        //     url: 'https://goctruyentranh.com/trang-chu',
        //     method: "GET",
        // });
        // let featuredItems: MangaTile[] = [];
        // data = await this.requestManager.schedule(request, 1);
        // $ = this.cheerio.load(data.data);
        // for (let obj of $('.background-banner ', '#slideshow').toArray()) {
        //     const image = $(`a > img`, obj).attr('src') ?? "";
        //     let id = 'https://goctruyentranh.com' + $(`a`, obj).attr("href") ?? "";
        //     featuredItems.push(createMangaTile({
        //         id: id,
        //         image: image ?? "",
        //         title: createIconText({
        //             text: '',
        //         }),
        //         subtitleText: createIconText({
        //             text: '',
        //         }),
        //     }))
        // }
        // featured.items = featuredItems;
        // sectionCallback(featured);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 0;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "hot":
                url = `https://goctruyentranh.com/api/comic/search/view?p=${page}`;
                break;
            case "new_updated":
                url = `https://goctruyentranh.com/api/comic/search/recent?p=${page}`;
                break;
            case "new_added":
                url = `https://goctruyentranh.com/api/comic/search/new?p=${page}`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method,
            param
        });

        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;

        const manga = parseViewMore(json);
        metadata = { page: page + 1 };
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 0;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: query.title ? encodeURI(`https://goctruyentranh.com/api/comic/search?name=${query.title}`) : `https://goctruyentranh.com/api/comic/search/category?p=${page}&value=${tags[0]}`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const tiles = parseSearch(json)

        metadata = query.title ? undefined : { page: page + 1 };

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = `https://goctruyentranh.com/api/category`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1)
        const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
        const arrayTags: Tag[] = [];
        //the loai
        for (const tag of json.result) {
            const label = tag.name;
            const id = tag.id;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }


        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://goctruyentranh.com/'
        }
    }
}