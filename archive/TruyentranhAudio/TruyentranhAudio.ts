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
    HomeSectionType
} from "paperback-extensions-common"

import axios from "axios";
import { parseSearch, isLastPage, parseViewMore } from "./TruyentranhAudioParser"

const DOMAIN = 'https://truyentranhaudio.online/'
const method = 'GET'

export const TruyentranhAudioInfo: SourceInfo = {
    version: '3.0.0',
    name: 'TruyentranhAudio',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from TruyentranhAudio',
    websiteBaseURL: `https://lxhentai.com/`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class TruyentranhAudio extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}/${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${mangaId}`,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 10);
        let $ = this.cheerio.load(data.data); //lỗi từ dòng này
        let tags: Tag[] = [];
        // let creator = [];
        // let status = 1; //completed, 1 = Ongoing
        // let desc = $('.story-detail-info').text();
        // for (const t of $('a', '.list01').toArray()) {
        //     const genre = $(t).text().trim()
        //     const id = $(t).attr('href') ?? genre
        //     tags.push(createTag({ label: genre, id }));
        // }
        // for (const c of $('a', '.txt > p:nth-of-type(1)').toArray()) {
        //     const name = $(c).text().trim()
        //     creator.push(name);
        // }
        // status = $('.txt > p:nth-of-type(2)').text().toLowerCase().includes("đang cập nhật") ? 1 : 0;
        // const image = $('.left > img').attr('src') ?? "";
        return createManga({
            id: mangaId,
            author: 'huynh',
            artist: 'huynh',
            desc: '',
            titles: [$('h1.title-detail').text()],
            image: 'https://lxhentai.com' + $('.col-md-8 > .row > .col-md-4 > img').attr('src'),
            status: 1,
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
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $("#listChuong > ul > .row:not(:first-child) > div.col-5").toArray().reverse()) {
            i++;
            chapters.push(createChapter(<Chapter>{
                id: 'https://lxhentai.com' + $('a', obj).attr('href'),
                chapNum: i,
                name: $('a', obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: chapterId,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('#content_chap img').toArray()) {
            let link = 'https:' + obj.attribs['src'];
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
        // let hot: HomeSection = createHomeSection({
        //     id: 'hot',
        //     title: "TRUYỆN HOT TRONG NGÀY",
        //     view_more: false,
        // });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "TRUYỆN MỚI ĐĂNG",
            view_more: true,
        });

        //Load empty sections
        // sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        // Hot
        // let request = createRequestObject({
        //     url: 'https://lxhentai.com/story/cat.php?id=57',
        //     method: "GET",
        // });
        // let popular: MangaTile[] = [];
        // let data = await this.requestManager.schedule(request, 1);
        // let $ = this.cheerio.load(data.data);
        // for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray()) {
        //     const title = $('a', manga).last().text().trim();
        //     const id = $('a', manga).last().attr('href') ?? title;
        //     const image = $('div', manga).first().css('background');
        //     const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        //     const sub = $('a', manga).first().text().trim();
        //     // if (!id || !subtitle) continue;
        //     popular.push(createMangaTile({
        //         id: 'https://lxhentai.com' + id,
        //         image: 'https://lxhentai.com' + bg,
        //         title: createIconText({
        //             text: title,
        //         }),
        //         subtitleText: createIconText({
        //             text: sub,
        //         }),
        //     }))
        // }
        // hot.items = popular;
        // sectionCallback(hot);

        //New Updates
        let request = createRequestObject({
            url: 'https://lxhentai.com/story/cat.php?id=75',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray()) {
            const title = $('a', manga).last().text().trim();
            const id = $('a', manga).last().attr('href') ?? title;
            const image = $('div', manga).first().css('background');
            const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('a', manga).first().text().trim();
            newUpdatedItems.push(createMangaTile({
                id: 'https://lxhentai.com' + id,
                image: 'https://lxhentai.com' + bg,
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

        //New Added
        request = createRequestObject({
            url: 'https://lxhentai.com/story/cat.php?id=57',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('div.col-md-3', '.main .col-md-8 > .row').toArray()) {
            const title = $('a', manga).last().text().trim();
            const id = $('a', manga).last().attr('href') ?? title;
            const image = $('div', manga).first().css('background');
            const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('a', manga).first().text().trim();
            newAddItems.push(createMangaTile({
                id: 'https://lxhentai.com' + id,
                image: 'https://lxhentai.com' + bg,
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
                url = `https://lxhentai.com/story/cat.php?id=75&p=${page}`;
                break;
            case "new_added":
                url = `https://lxhentai.com/story/cat.php?id=57&p=${page}`;
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

        const search = {
            category: '',
            country: "0",
            status: "-1",
            minchapter: "0",
            sort: "0"
        };

        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const category: string[] = [];
        tags.map((value) => {
            if (value.indexOf('.') === -1) {
                category.push(value)
            } else {
                switch (value.split(".")[0]) {
                    case 'minchapter':
                        search.minchapter = (value.split(".")[1]);
                        break
                    case 'country':
                        search.country = (value.split(".")[1]);
                        break
                    case 'sort':
                        search.sort = (value.split(".")[1]);
                        break
                    case 'status':
                        search.status = (value.split(".")[1]);
                        break
                }
            }
        })
        search.category = (category ?? []).join(",");
        const request = createRequestObject({
            url: query.title ? `${DOMAIN}tim-kiem/trang-${page}.html` : `${DOMAIN}tim-kiem-nang-cao/trang-${page}.html`,
            method: "GET",
            param: encodeURI(`?q=${query.title ?? ''}&category=${search.category}&country=${search.country}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}`)
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
        const url = `${DOMAIN}tim-kiem-nang-cao.html`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data);
        const arrayTags: Tag[] = [];
        const arrayTags2: Tag[] = [];
        const arrayTags3: Tag[] = [];
        const arrayTags4: Tag[] = [];
        const arrayTags5: Tag[] = [];
        //the loai
        for (const tag of $('div.genre-item', 'div.col-sm-10').toArray()) {
            const label = $(tag).text().trim();
            const id = $('span', tag).attr('data-id') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }
        //quoc gia
        for (const tag of $('option', 'select#country').toArray()) {
            const label = $(tag).text().trim();
            const id = 'country.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags2.push({ id: id, label: label });
        }
        //tinh trang
        for (const tag of $('option', 'select#status').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags3.push({ id: id, label: label });
        }
        //so luong chuong
        for (const tag of $('option', 'select#minchapter').toArray()) {
            const label = $(tag).text().trim();
            const id = 'minchapter.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags4.push({ id: id, label: label });
        }
        //sap xep
        for (const tag of $('option', 'select#sort').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value') ?? label;
            if (!id || !label) continue;
            arrayTags5.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại Truyện', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Quốc Gia (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Số Lượng Chương (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Sắp xếp (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh trong page thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: 'https://lxhentai.com/'
        }
    }
}