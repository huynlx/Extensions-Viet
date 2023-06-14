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
    Request,
    HomeSectionType,
    Response
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage, decodeHTMLEntity } from "./TruyengihotParser"

const DOMAIN = 'https://truyengihotne.com/'
const method = 'GET'

export const TruyengihotInfo: SourceInfo = {
    version: '1.5.1',
    name: 'Truyengihot',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyengihot',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Truyengihot extends Source {
    protected convertTime(timeAgo: string): Date {
        let time: Date
        let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0])
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed
        if (timeAgo.includes('giây')) {
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
            time = new Date(Date.now() - trimmed * 86400000 * 7 * 4 * 12)
        } else {
            if (timeAgo.includes(":")) {
                let split = timeAgo.split(' ');
                let H = split[0]; //vd => 21:08
                let D = split[1]; //vd => 25/08 
                let fixD = D.split('/');
                let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
                time = new Date(finalD + ' ' + H);
            } else {
                let split = timeAgo.split('/'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time
    }
    getMangaShareUrl(mangaId: string): string { return (mangaId) };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': DOMAIN
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
        let creator = decodeHTMLEntity($(".cover-artist a[href*=tac-gia]").text() || '');
        let statusFinal = $('.cover-artist img.top-tags').toArray();
        for (const x of statusFinal) {
            if (x.attribs['src'].includes('full.png')) {
                statusFinal = 0;
                break;
            } else {
                statusFinal = 1;
                break;
            }
        }
        for (const t of $('.cover-artist a[href*=the-loai]').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: decodeHTMLEntity(genre), id }));
        }
        let desc = decodeHTMLEntity($(".product-synopsis-content").html()).replace(/  +/g, '\n').replace(/<[^>]+>/g, '').replace('Xem thêm', '').trim();
        let image = $(".cover-image img").first().attr("src");
        if (!image.includes('http')) image = 'https://truyengihot.net/' + image;

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($("h2.cover-title").text())],
            image: encodeURI(decodeHTMLEntity(image)),
            status: statusFinal,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })],
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
        var el = $("#episode_list li a").toArray().reverse();
        const collectChapnum: any = [];
        const collectName: any = [];
        for (var i = 0; i <= el.length - 1; i++) {
            var e = el[i];
            let id = 'https://truyengihot.net/' + $(e).attr("href");
            let name = $('.no', e).text().trim();
            if (collectName.includes(name)) continue;
            collectName.push(name);
            let chapNum = parseFloat(name.split(' ')[1]);
            let chapNumfinal = isNaN(chapNum) ? i + 1 : (collectChapnum.includes(chapNum) ? (i + 1) : chapNum);
            collectChapnum.push(chapNumfinal);
            if ($('span', e).first().attr('class') === 'episode-item-lock') name = '(LOCKED) ' + name;
            let time = $('.date', e).text().trim();
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: chapNumfinal,
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: this.convertTime(decodeHTMLEntity(time))
            }));
        }
        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${chapterId}`,
            method
        });
        const base = 'https://truyengihot.net/'
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const pages: string[] = [];
        var el = $(".pageWrapper img").toArray();
        for (var i = 0; i < el.length; i++) {
            var e = el[i];
            let img = $(e).attr("data-echo");
            if (!img) continue;
            if (!img.includes('http')) img = base + img;
            pages.push(img);
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
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);

        ///Get the section dat

        //New Updates
        let request = createRequestObject({
            url: 'https://truyengihot.net/danh-sach-truyen.html?page=1',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        var allItem = $('ul.cw-list li').toArray();
        for (var i in allItem) {
            var item = allItem[i];
            let title = $('.title a', item).text();
            let image = $('.thumb', item).attr('style').split(/['']/)[1];
            if (!image.includes('http')) image = 'https://truyengihot.net/' + image;
            let id = 'https://truyengihot.net' + $('.title a', item).attr('href');
            let subtitle = $('.chapter-link', item).last().text();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //featured
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('#swiper-hot .swiper-slide a').toArray()) {
            let title = $('.info', element).text().trim();
            let image = $('img', element).attr("src");
            if (!image.includes('http')) image = 'https://truyengihot.net/' + image;
            let id = 'https://truyengihot.net' + $(element).attr('href');
            featuredItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://truyengihot.net/danh-sach-truyen.html?page=${page}`;
                select = 1;
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
            genre: "",
            status: "",
            sort: "last_update",
            type: "",
            sortType: "DESC"
        };
        const genres: any = [];
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'genre':
                    genres.push(value.split(".")[1]);
                    break
                case 'status':
                    search.status = (value.split(".")[1]);
                    break
                case 'sort':
                    search.sort = (value.split(".")[1]);
                    break
                case 'type':
                    search.type = (value.split(".")[1]);
                    break
                case 'sortType':
                    search.sortType = (value.split(".")[1]);
                    break
            }
        })
        search.genre = (genres ?? []).join(",");
        const request = createRequestObject({
            url: encodeURI(`${DOMAIN}danh-sach-truyen.html?listType=pagination&artist=&author=&group=&m_status=${search.status}&genre=${search.genre}&ungenre=&sort=${search.sort}&sort_type=${search.sortType}&manga_type=${search.type}&name=${query.title ?? ""}&page=${page}`),
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
        const tags3: Tag[] = [];
        const tags4: Tag[] = [];
        const tags5: Tag[] = [];

        const request = createRequestObject({
            url: 'https://truyengihot.net/danh-sach-truyen.html',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //loai truyen
        for (const tag of $('#m_manga_type button').toArray()) {
            let label = $(tag).text().trim();
            let id = 'type.' + $(tag).attr('data-val');
            if (!id || !label) continue;
            tags.push({ id: id, label: (label) });
        }
        //the loai
        for (const tag of $('#m_genres button').toArray()) {
            let label = $(tag).text().trim();
            let id = 'genre.' + $(tag).attr('data-val');
            if (!id || !label) continue;
            tags2.push({ id: id, label: (label) });
        }
        //trang thai
        for (const tag of $('#m_status button').toArray()) {
            let label = $(tag).text().trim();
            let id = 'status.' + $(tag).attr('data-val');
            if (!id || !label) continue;
            tags3.push({ id: id, label: (label) });
        }
        //sap xep
        for (const tag of $('#m_sort button').toArray()) {
            let label = $(tag).text().trim();
            let id = 'sort.' + $(tag).attr('data-val');
            if (!id || !label) continue;
            tags4.push({ id: id, label: (label) });
        }
        //loai sap xep
        for (const tag of $('#m_sort_type button').toArray()) {
            let label = $(tag).text().trim();
            let id = 'sortType.' + $(tag).attr('data-val');
            if (!id || !label) continue;
            tags5.push({ id: id, label: (label) });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Loại truyện', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Thể loại', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Trạng thái', tags: tags3.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Sắp xếp', tags: tags4.map(x => createTag(x)) }),
            createTagSection({ id: '5', label: 'Loại sắp xếp', tags: tags5.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}
