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
    HomeSectionType,
    Tag,
    LanguageCode,
    MangaTile
} from "paperback-extensions-common"
import { parseSearch, parseViewMore, decodeHTMLEntity, parseManga, ucFirstAllWords } from "./MangaXYParser"

const DOMAIN = 'https://mangaxy.com/'
const method = 'GET'

export const MangaXYInfo: SourceInfo = {
    version: '1.0.0',
    name: 'MangaXY',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from MangaXY',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class MangaXY extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 15000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var checkCover = $(".detail-top-right img").attr("style");
        var cover = '';
        if (checkCover?.indexOf('jpg') != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1 || checkCover.indexOf('webp') != -1 || checkCover.indexOf('gif') != -1)
            cover = checkCover.match(/image: url\('\/\/(.+)\'\)/)[1]
        else
            cover = ""
        let tags: Tag[] = [];
        let creator = '';
        let status = 1; //completed, 1 = Ongoing
        let desc = $(".manga-info p").text();

        creator = $(".created-by a").text();
        for (const t of $('.top-comics-type > a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href') ?? genre
            tags.push(createTag({ label: ucFirstAllWords(genre), id }));
        }
        var loop = $(".manga-info ul li a").toArray();
        for (var el in loop) {
            let x = loop[el];
            if ($(x).text().includes("Đang tiến hành") || $(x).text().includes("Đã hoàn thành")) {
                status = $(x).text().toLowerCase().includes('đang') ? 1 : 0;
                break;
            } else {
                continue;
            }
        }
        const image = "https://" + cover;
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($("h1.comics-title").text())],
            image,
            status,
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
        var el = $("#ChapList a").toArray();
        const chapters: Chapter[] = [];
        for (var i = el.length - 1; i >= 0; i--) {
            var e = el[i];
            const name = $(".episode-title", e).text().trim();
            const timeStr = ($('.episode-date > time', e).attr('datetime')?.split(" ")) ?? "";
            const day = timeStr[0].split('-');
            const h = timeStr[1].split(":");
            const finalDay = day[1] + '/' + day[2] + '/' + day[0];
            const finalH = h[0] + ':' + h[1];
            chapters.push(createChapter(<Chapter>{
                id: $(e).attr("href"),
                chapNum: isNaN(parseFloat(name.split(" ")[1])) ? i + 1 : parseFloat(name.split(" ")[1]),
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(finalDay + ' ' + finalH)
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
        for (let obj of $('.page-chapter img').toArray()) {
            if (!obj.attribs['src']) continue;
            let link = obj.attribs['src'];
            pages.push(encodeURI(link.trim()));
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
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Chap mới",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "Truyện mới",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Xem nhiều",
            view_more: true,
        });
        let az: HomeSection = createHomeSection({
            id: 'az',
            title: "A-Z",
            view_more: true,
        });


        //Load empty sections

        sectionCallback(newUpdated);
        sectionCallback(newAdded);
        sectionCallback(hot);
        sectionCallback(az);

        ///Get the section data
        //Featured
        let url = 'https://mangaxy.com/';
        let request = createRequestObject({
            url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var featuredItems: MangaTile[] = [];
        for (const obj of $('.item', '#mangaXYThucHien').toArray()) {
            var checkCover = $(".thumb", obj).attr("style");
            var cover = '';
            if (checkCover?.indexOf('jpg') != -1 || checkCover.indexOf('png') != -1 || checkCover.indexOf('jpeg') != -1)
                cover = checkCover?.match(/image: url\('\/\/(.+)\'\)/)?.[1] ?? "" //regex
            else
                cover = ""
            var title = $(".name", obj).text().includes(']') ? $(".name", obj).text().split(']')[1].trim() : $(".name", obj).text().trim();
            var id = $(".thumb", obj).attr('href');
            var sub = $(".chap", obj).text();
            featuredItems.push(createMangaTile({
                id,
                image: "https://" + cover,
                title: createIconText({
                    text: title.includes('-') ? title.split('-')[1].trim() : title,
                }),
                subtitleText: createIconText({
                    text: sub,
                })
            }));
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //New Updates
        url = 'https://mangaxy.com/search.php?andor=and&van=&sort=chap&view=thumb&act=timnangcao&ajax=true&page=1';
        request = createRequestObject({
            url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        newUpdated.items = parseManga($);
        sectionCallback(newUpdated);

        //New Added
        url = 'https://mangaxy.com/search.php?andor=and&sort=truyen&view=thumb&act=timnangcao&ajax=true&page=1'
        request = createRequestObject({
            url: url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        newAdded.items = parseManga($);
        sectionCallback(newAdded);

        //Hot
        url = 'https://mangaxy.com/search.php?andor=and&sort=xem&view=thumb&act=timnangcao&ajax=true&page=1';
        request = createRequestObject({
            url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        hot.items = parseManga($);
        sectionCallback(hot);

        //A-Z
        url = 'https://mangaxy.com/search.php?andor=and&sort=ten&view=thumb&act=timnangcao&ajax=true&page=1';
        request = createRequestObject({
            url,
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        az.items = parseManga($);
        sectionCallback(az);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://mangaxy.com/search.php?andor=and&van=&sort=chap&view=thumb&act=timnangcao&ajax=true&page=${page}`;
                break;
            case "new_added":
                url = `https://mangaxy.com/search.php?andor=and&sort=truyen&view=thumb&act=timnangcao&ajax=true&page=${page}`;
                break;
            case "az":
                url = `https://mangaxy.com/search.php?andor=and&sort=ten&view=thumb&act=timnangcao&ajax=true&page=${page}`;
                break;
            case "hot":
                url = `https://mangaxy.com/search.php?andor=and&sort=xem&view=thumb&act=timnangcao&ajax=true&page=${page}`;
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
        metadata = manga.length !== 0 ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: query.title ? encodeURI("https://mangaxy.com/search.php?andor=and&q=" + query.title + "&page=" + page + "&view=thumb&act=timnangcao&ajax=true") :
                encodeURI(tags[0] + page),
            method: "GET"
        });

        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($);

        metadata = tiles.length !== 0 ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = "https://mangaxy.com/"
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        var element = $(".megalist > ul.col4 a").toArray()
        //the loai
        for (var el in element) {
            var book = element[el]
            const label = $(book).text().trim();
            const id = $(book).attr("href") + "page=" ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể loại', tags: arrayTags.map(x => createTag(x)) })
        ]
        return tagSections;
    }

    // globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
    //     return {
    //         referer: DOMAIN
    //     }
    // }
}