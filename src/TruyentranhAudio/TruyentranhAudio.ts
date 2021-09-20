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
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class TruyentranhAudio extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: DOMAIN + mangaId, //ex:https://truyentranhaudio.online/truyen-vo-luyen-dinh-phong.html
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        const genres = [];
        let status = 1;
        let desc = $('.summary-content > p').text();
        for (const t of $('a', '.manga-info > li:nth-of-type(3)').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href')?.trim() ?? genre
            tags.push(createTag({ label: genre, id }));
            genres.push(
                {
                    label: genre,
                    id
                }
            );
        }
        const image = $('info-cover > .thumbnail').attr('src') ?? "fuck";
        const creator = $('a', '.manga-info > li:nth-of-type(2)').text();

        //log
        console.log(DOMAIN + mangaId);
        console.log('image: ' + image);
        console.log('title: ' + $('.manga-info > h3').text());
        console.log('creator: ' + creator);
        console.log(genres);
        console.log('desc: ' + desc + '/n');

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [$('.manga-info > h3').text()],
            image: image,
            status,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: DOMAIN + mangaId,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".list-chapters > li").toArray().reverse()) {
            var chapNum = parseFloat($('a > .chapter-name', obj).text().split(' ')[1]);
            i++;
            chapters.push(createChapter(<Chapter>{
                id: $('a', obj).attr('href'),
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: $('a', obj).attr('title'),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}${chapterId}`,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        for (let obj of $('.chapter-content > img').toArray()) {
            if (!obj.attribs['data-src']) continue;
            let link = obj.attribs['data-src'].trim();
            pages.push(link);
        }
        console.log(pages);
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
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "TRUYỆN MỚI ĐĂNG",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(hot);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        // Hot
        let request = createRequestObject({
            url: 'https://truyentranhaudio.com/',
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
                image: bg?.includes('http') ? (bg) : ("https:" + bg),
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: sub }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        //New Updates
        request = createRequestObject({
            url: 'https://truyentranhaudio.com/',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-lg-8.col-sm-8 > .card:nth-child(3) .row-last-update').toArray()) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.series-title > a', manga).attr('href') ?? title;
            const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).attr('data-bg');
            const sub = $('a', manga).last().text().trim();
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image?.includes('http') ? (image) : ("https:" + image),
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
            url: 'https://truyentranhaudio.com/',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.thumb-item-flow:not(:last-child)', '.col-lg-8.col-sm-8 > .card:nth-child(6) .row-last-update').toArray()) {
            const title = $('.series-title', manga).text().trim();
            const id = $('.series-title > a', manga).attr('href') ?? title;
            const image = $('.thumb-wrapper > a > .a6-ratio > .img-in-ratio', manga).attr('data-bg');
            const sub = $('a', manga).last().text().trim();
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: image?.includes('http') ? (image) : ("https:" + image),
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
                url = `https://truyentranhaudio.com/manga-list.html?page=${page}`;
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

    // async getSearchTags(): Promise<TagSection[]> {
    //     const url = `${DOMAIN}tim-kiem-nang-cao.html`
    //     const request = createRequestObject({
    //         url: url,
    //         method: "GET",
    //     });

    //     const response = await this.requestManager.schedule(request, 1)
    //     const $ = this.cheerio.load(response.data);
    //     const arrayTags: Tag[] = [];
    //     const arrayTags2: Tag[] = [];
    //     const arrayTags3: Tag[] = [];
    //     const arrayTags4: Tag[] = [];
    //     const arrayTags5: Tag[] = [];
    //     //the loai
    //     for (const tag of $('div.genre-item', 'div.col-sm-10').toArray()) {
    //         const label = $(tag).text().trim();
    //         const id = $('span', tag).attr('data-id') ?? label;
    //         if (!id || !label) continue;
    //         arrayTags.push({ id: id, label: label });
    //     }
    //     //quoc gia
    //     for (const tag of $('option', 'select#country').toArray()) {
    //         const label = $(tag).text().trim();
    //         const id = 'country.' + $(tag).attr('value') ?? label;
    //         if (!id || !label) continue;
    //         arrayTags2.push({ id: id, label: label });
    //     }
    //     //tinh trang
    //     for (const tag of $('option', 'select#status').toArray()) {
    //         const label = $(tag).text().trim();
    //         const id = 'status.' + $(tag).attr('value') ?? label;
    //         if (!id || !label) continue;
    //         arrayTags3.push({ id: id, label: label });
    //     }
    //     //so luong chuong
    //     for (const tag of $('option', 'select#minchapter').toArray()) {
    //         const label = $(tag).text().trim();
    //         const id = 'minchapter.' + $(tag).attr('value') ?? label;
    //         if (!id || !label) continue;
    //         arrayTags4.push({ id: id, label: label });
    //     }
    //     //sap xep
    //     for (const tag of $('option', 'select#sort').toArray()) {
    //         const label = $(tag).text().trim();
    //         const id = 'sort.' + $(tag).attr('value') ?? label;
    //         if (!id || !label) continue;
    //         arrayTags5.push({ id: id, label: label });
    //     }

    //     const tagSections: TagSection[] = [
    //         createTagSection({ id: '0', label: 'Thể Loại Truyện', tags: arrayTags.map(x => createTag(x)) }),
    //         createTagSection({ id: '1', label: 'Quốc Gia (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
    //         createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
    //         createTagSection({ id: '3', label: 'Số Lượng Chương (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
    //         createTagSection({ id: '4', label: 'Sắp xếp (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
    //     ]
    //     return tagSections;
    // }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: `${DOMAIN} `
        }
    }
}