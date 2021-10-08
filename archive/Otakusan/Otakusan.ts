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
    Request
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage, decodeHTMLEntity } from "./OtakusanParser"

const DOMAIN = 'https://otakusan.net/'
const method = 'GET'

export const OtakusanInfo: SourceInfo = {
    version: '1.5.0',
    name: 'Otakusan',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Otakusan',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Otakusan extends Source {
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
                let split = timeAgo.split('/'); //vd => 05/12/18
                time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
            }
        }
        return time
    }
    getMangaShareUrl(mangaId: string): string { return (DOMAIN + mangaId) };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = 'https://otakusan.net' + mangaId;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var el = $("div.row .manga-top");
        let tags: Tag[] = [];
        let creator = '';
        let statusFinal = 1;
        creator = $(".table-striped > tbody > tr:nth-child(5) > td > a", el).attr('title');
        for (const t of $('.genres > a', el).toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        let status = $(".table-striped > tbody > tr:nth-child(6) > td", el).text().trim(); //completed, 1 = Ongoing
        statusFinal = status.toLowerCase().includes("ongoing") ? 1 : 0;
        let desc = $("p.summary", el).text();
        const image = $(".col-lg-3 .manga-top-img img", el).attr("src");
        return createManga({
            id: mangaId,
            author: decodeHTMLEntity(creator),
            artist: decodeHTMLEntity(creator),
            desc: desc,
            titles: [decodeHTMLEntity($(".manga-top-main .manga-top-info h1", el).text())],
            image,
            status: statusFinal,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const url = 'https://otakusan.net' + mangaId;
        const request = createRequestObject({
            url,
            method,
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapters: Chapter[] = [];
        var i = 0;
        var el = $("#chapter > table > tbody tr td a.thrilldown").toArray();
        for (var i = el.length - 1; i >= 0; i--) {
            var e = el[i];
            let id = $(e).attr('href');
            let chapNum = parseFloat($(e).text().trim()?.split(' ')[1]);
            let name = decodeHTMLEntity($(e).text().trim());
            // let time = $('.chapter-time', obj).first().text().trim();
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: isNaN(chapNum) ? i : chapNum,
                name,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                // time: this.convertTime(time)
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `https://otakusan.net${chapterId}`,
            method
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const pages: string[] = [];
        for (let obj of $('.chapter-content img').toArray()) {
            let link = $(obj).attr('data-original') ?? "";
            pages.push(link.replace(/\n/g, ''));
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
            title: "Mới Cập Nhập",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "TRUYỆN MỚI ĐĂNG",
            view_more: false,
        });

        //Load empty sections
        // sectionCallback(hot);
        sectionCallback(newUpdated);
        // sectionCallback(view);

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
            const bg = image.replace('url(', '').replace(')', '').replace(/\"/gi, "");
            const sub = $('.chapter-title > a', manga).text().trim()
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: bg?.includes('http') ? (bg) : ("https://manhuarock.net" + bg),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub.replace('Chap', 'Chương') }),
            }));
        }
        hot.items = popular;
        // sectionCallback(hot);
        //New Updates
        var url = 'https://otakusan.net/Manga/Newest';
        request = createRequestObject({
            url: url,
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                "Lang": "vn",
                "Page": '0',
                "Type": "1",
                "Dir": "NewPostedDate",
                "FilterCategory": 'All'
            }
        });
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        var allBook = $('.picture-card').toArray();
        let newUpdatedItems: MangaTile[] = [];
        for (var i in allBook) {
            var book = allBook[i]
            newUpdatedItems.push(createMangaTile({
                id: $(".mdl-card__title a", book).attr("href") ?? "",
                image: $(".mdl-card__title img", book).attr("src") ?? "",
                title: createIconText({ text: decodeHTMLEntity($(".mdl-card__title img", book).attr("title")) }),
                subtitleText: createIconText({ text: $('.mdl-card__actions > a', book).text().trim() }),
            }))

        }
        // if (listBook.length == 0) next = ""; 
        // else next = (parseInt(page) + 1).toString();
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
        for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-md-8 > .card:nth-child(5) .row').toArray()) {
            let title = $('.series-title > a', manga).text().trim();
            let image = $('.a6-ratio > .img-in-ratio', manga).attr("data-bg");
            if (!image?.includes('http')) {
                image = 'https://manhuarock.net' + image;
            } else {
                image = image;
            }
            let id = $('.series-title > a', manga).attr('href') ?? title;
            let subtitle = $(".chapter-title > a", manga).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: image ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        view.items = viewItems;
        // sectionCallback(view);
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
        const tags6: Tag[] = [];

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
        //nhom dich
        for (const tag of $('.navbar-nav > li.nav-item:nth-child(2) .no-gutters a.genres-item').toArray()) {
            const label = $(tag).text().trim();
            const id = 'translater.' + $(tag).attr('href').split('-nhom-dich-')[1].split('.')[0];;
            if (!id || !label) continue;
            tags6.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '0', label: 'Kiểu sắp xếp', tags: tagss.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }),
            createTagSection({ id: '5', label: 'Nhóm dịch', tags: tags6.map(x => createTag(x)) }),
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