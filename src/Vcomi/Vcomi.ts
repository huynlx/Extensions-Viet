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
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage } from "./VcomiParser"

const DOMAIN = 'https://vcomi.co/'
const method = 'GET'

export const VcomiInfo: SourceInfo = {
    version: '2.0.1',
    name: 'Vcomi',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Vcomi',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Vcomi extends Source {
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
    getMangaShareUrl(mangaId: string): string { return (DOMAIN + mangaId) };
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
        const url = DOMAIN + mangaId;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        let tags: Tag[] = [];
        let creator = '';
        let statusFinal = 1;
        for (const test of $('li', '.manga-info').toArray()) {
            switch ($('b', test).text().trim()) {
                case "Tác giả":
                    creator = $('a', test).text().trim();
                    break;
                case "Thể loại":
                    for (const t of $('a', test).toArray()) {
                        const genre = $(t).text().trim();
                        const id = $(t).attr('href') ?? genre;
                        tags.push(createTag({ label: genre, id }));
                    }
                    break;
                case "Tình trạng":
                    let status = $('a', test).text().trim(); //completed, 1 = Ongoing
                    statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
                    break;
            }

        }

        let desc = $(".summary-content").text();
        let image = $('.info-cover img').attr("src") ?? "";
        if (!image?.includes('http')) {
            if (image?.startsWith('//')) {
                image = 'https:' + image;
            } else {
                image = 'https://vcomi.co/' + image
            }
        } else {
            image = image;
        }
        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [$('.manga-info h3').text().trim()],
            image: encodeURI(image),
            status: statusFinal,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: DOMAIN + mangaId,
            method,
        });
        let data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $('.list-chapters > a').toArray().reverse()) {
            i++;
            let id = DOMAIN + $(obj).first().attr('href');
            let chapNum = parseFloat($('.chapter-name', obj).first().text()?.split(' ')[1]);
            let name = $('.chapter-view', obj).first().text().trim();
            let time = $('.chapter-time', obj).first().text().trim();
            // let H = time[0];
            // let D = time[1].split('/');
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: isNaN(chapNum) ? i : chapNum,
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
        for (let obj of $('.chapter-content img').toArray()) {
            let image = $(obj).attr('data-original').replace(/\n/g, '') ?? "";
            if (!image?.includes('http')) {
                if (image?.startsWith('//')) {
                    image = 'https:' + image;
                } else {
                    image = 'https://vcomi.co/' + image
                }
            } else {
                image = image;
            }
            pages.push(encodeURI(image));
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
            title: "TRUYỆN HOT TRONG NGÀY",
            view_more: false,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "TRUYỆN MỚI ĐĂNG",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(view);

        ///Get the section data

        // Hot
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let popular: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('.owl-item', '.owl-stage').toArray()) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.thumb-wrapper > a', manga).attr('href');
            const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).css('background-image') ?? "";
            let bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
            const sub = $('.chapter-title > a', manga).text().trim()
            if (!bg?.includes('http')) {
                if (bg?.startsWith('//')) {
                    bg = 'https:' + bg;
                } else {
                    bg = 'https://vcomi.co/' + bg
                }
            } else {
                bg = bg;
            }
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: encodeURI(bg),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub.replace('Chap', 'Chương') }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        //New Updates
        request = createRequestObject({
            url: DOMAIN + 'manga-list.html?listType=pagination&page=1&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=last_update&sort_type=DESC',
            method: "GET",
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('.card-body > .row > .thumb-item-flow').toArray()) {
            let title = $('.series-title > a', element).text().trim();
            let image = $('.a6-ratio > .img-in-ratio', element).attr("data-bg");
            if (!image?.includes('http')) {
                if (image?.startsWith('//')) {
                    image = 'https:' + image;
                } else {
                    image = 'https://vcomi.co/' + image
                }
            } else {
                image = image;
            }
            let id = $('.series-title > a', element).attr('href') ?? title;
            let subtitle = 'Chương ' + $(".chapter-title > a", element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(image) ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //view
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(4) .row').toArray()) {
            let title = $('.series-title > a', manga).text().trim();
            let image = $('.a6-ratio > .img-in-ratio', manga).attr("data-bg");
            if (!image?.includes('http')) {
                if (image?.startsWith('//')) {
                    image = 'https:' + image;
                } else {
                    image = 'https://vcomi.co/' + image
                }
            } else {
                image = image;
            }
            let id = $('.series-title > a', manga).attr('href') ?? title;
            let subtitle = $(".chapter-title > a", manga).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(image) ?? "",
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
                url = DOMAIN + `manga-list.html?listType=pagination&page=${page}&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=last_update&sort_type=DESC`;
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
            cate: '',
            translater: "",
            status: "",
            sort: "views",
            type: 'DESC'
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
                    break
                case 'translater':
                    search.translater = (value.split(".")[1]);
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
            }
        })
        const request = createRequestObject({
            url: encodeURI(`${DOMAIN}manga-list.html?listType=pagination&page=${page}&group=${search.translater}&m_status=${search.status}&name=${query.title ?? ''}&genre=${search.cate}&sort=${search.sort}&sort_type=${search.type}`),
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
        const tags2: Tag[] = [
            {
                id: 'sort.name',
                label: 'A-Z'
            },
            {
                id: 'sort.views',
                label: 'Lượt Xem'
            },
            {
                id: 'sort.last_update',
                label: 'Mới Cập Nhật'
            }
        ];
        const tagss = [
            {
                id: 'type.ASC',
                label: 'ASC'
            },
            {
                id: 'type.DESC',
                label: 'DESC'
            }
        ]
        const tags5: Tag[] = [];

        const url = DOMAIN + `search`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.navbar-nav > li.nav-item:nth-child(1) .no-gutters a.genres-item').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('href').split('-the-loai-')[1].split('.')[0];
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        //trang thai
        for (const tag of $('select#TinhTrang option').toArray()) {
            var label = $(tag).text().trim();
            if (label === 'Hoàn thành') {
                label = 'Đang tiến hành'
            } else if (label === 'Đang tiến hành') {
                label = 'Hoàn thành'
            }
            const id = 'status.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags5.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '0', label: 'Kiểu sắp xếp', tags: tagss.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) })
        ]
        return tagSections;
    }
}