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

import { parseSearch, isLastPage, parseViewMore } from "./Truyen69Parser"

const DOMAIN = 'https://www.truyen69.ml/'
const method = 'GET'

export const Truyen69Info: SourceInfo = {
    version: '1.0.0',
    name: 'Truyen69',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyen69',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class Truyen69 extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 3000
    })
    Slg = '';
    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: mangaId,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        // let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let status = $('.list-info > li:nth-child(2) b').text().includes('Hoàn thành') ? 0 : 1;
        let desc = 'Xem là biết :))';
        for (const t of $('.list01.li03 > a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href')?.trim() ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        const image = 'https://www.truyen69.ml/' + $('.wrap-content-image > img').attr('src') ?? "fuck";
        const creator = $('.list-info > li:nth-child(1) a').text();

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [$('.wrap-content-info > .title').text()],
            image: image,
            status,
            hentai: true,
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
        var dt = response.data.match(/Data_LstC = (.*);/)?.[1];
        this.Slg = response.data.match(/Slg = (.*);/)?.[1] ?? "";
        var json = JSON.parse(dt ?? "");

        const chapters: Chapter[] = [];
        for (const obj of json) {
            i++;
            var chapNum = parseFloat(obj.Cn.split(' ')[1]);
            chapters.push(createChapter(<Chapter>{
                id: "https://www.truyen69.ml/" + this.Slg + "- chuong -" + obj.Cid + ".html" + "::" + obj.Cid,
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: obj.Cn,
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: 'https://www.truyen69.ml/app/manga/controllers/cont.chapterContent.php',
            method: 'post',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                'action': 'chapterContent',
                'slug': this.Slg.replace(/['"]+/g, ''),
                'loaichap': '1',
                'chapter': `${chapterId.split("::")[1]}`
            }
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('img:not(:first-child):not(:last-child)').toArray()) {
            if (!obj.attribs['src']) continue;
            let link = obj.attribs['src'].trim();
            pages.push(link.includes('http') ? link : 'https://www.truyen69.ml' + link);
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
            title: "TRUYỆN HOT",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "TRUYỆN ĐÃ HOÀN THÀNH",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        // Hot
        let request = createRequestObject({
            url: 'https://www.truyen69.ml/danh-sach-truyen.html?status=0&sort=views',
            method: "GET",
        });
        let popular: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        var dt = data.data.match(/Data_DST = (.*);/)?.[1];
        var json = JSON.parse(dt ?? "");

        for (let manga of json) {
            const title = manga.manga_Name;
            const id = 'https://www.truyen69.ml' + manga.manga_Url;
            const image = 'https://www.truyen69.ml' + manga.manga_Cover;
            const sub = manga.manga_LChap;
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

        //New Updates
        request = createRequestObject({
            url: 'https://www.truyen69.ml/danh-sach-truyen.html?status=0&sort=last_update',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        var dt = data.data.match(/Data_DST = (.*);/)?.[1];
        var json = JSON.parse(dt ?? "")

        for (let manga of json) {
            const title = manga.manga_Name;
            const id = 'https://www.truyen69.ml' + manga.manga_Url;
            const image = 'https://www.truyen69.ml' + manga.manga_Cover;
            const sub = manga.manga_LChap;
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

        //completed
        request = createRequestObject({
            url: 'https://www.truyen69.ml/danh-sach-truyen.html?status=1&sort=id',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        var dt = data.data.match(/Data_DST = (.*);/)?.[1];
        var json = JSON.parse(dt ?? "")

        for (let manga of json) {
            const title = manga.manga_Name;
            const id = 'https://www.truyen69.ml' + manga.manga_Url;
            const image = 'https://www.truyen69.ml' + manga.manga_Cover;
            const sub = manga.manga_LChap;
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
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=&sort=last_update`;
                break;
            case "new_added":
                url = `https://www.truyen69.ml/danh-sach-truyen.html?status=1&page=${page}&name=&genre=&sort=id`;
                break;
            case "hot":
                url = `https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=&sort=views`;
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
        var dt = response.data.match(/Data_DST = (.*);/)?.[1];
        var json = dt !== '' ? JSON.parse(dt ?? "") : [];
        const manga = parseViewMore(json);
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
            url: query.title ? encodeURI(`https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=${query.title}&genre=&sort=last_update`)
                : tags[0] !== 'Tất cả' ? encodeURI(`https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=${tags[0]}&sort=last_update`)
                    : encodeURI(`https://www.truyen69.ml/danh-sach-truyen.html?status=0&page=${page}&name=&genre=&sort=name`),
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        var dt = data.data.match(/Data_DST = (.*);/)?.[1];
        var json = dt !== '' ? JSON.parse(dt ?? "") : [];
        const tiles = parseSearch(json);
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
        //the loai
        for (const tag of $('#list_theloai > a').toArray()) {
            arrayTags.push({ id: $(tag).text().trim(), label: $(tag).text().trim() });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders {
        return {
            referer: `${DOMAIN}`
        }
    }
}