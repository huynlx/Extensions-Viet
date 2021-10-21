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

import { parseSearch, isLastPage, parseViewMore, decodeHTMLEntity, ChangeToSlug } from "./TruyendepParser"

const DOMAIN = 'https://truyendep.net/'
const method = 'GET'

export const TruyendepInfo: SourceInfo = {
    version: '2.4.0',
    name: 'Truyendep',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from Truyendep',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Truyendep extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: mangaId,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        // let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let status = 1;
        let creator = '';
        let desc = $('.entry-content').text();
        for (const t of $('.detail-manga-category a').toArray()) {
            const genre = $(t).text().trim()
            const id = $(t).attr('href')?.trim() ?? genre
            tags.push(createTag({ label: genre, id }));
        }
        for (const x of $('.truyen_info_right > li').toArray()) {
            switch ($('span', x).text().trim()) {
                case "Tác Giả:":
                    creator = $('a', x).text().trim() ? $('a', x).text().trim() : $(x).clone().children().remove().end().text().trim();
                    break;
                case "Trạng Thái :":
                    status = $('a', x).text().trim().toLowerCase().includes('đang') ? 1 : 0;
                    break;
                case "Thể Loại :":
                    for (const t of $('a', x).toArray()) {
                        const genre = $(t).text().trim()
                        const id = $(t).attr('href') ?? genre
                        tags.push(createTag({ label: genre, id }));
                    }
                    break;
            }
        }
        const image = $('.truyen_info_left img').attr('src').replace('-162x250', '') ?? "fuck";

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: decodeHTMLEntity(desc),
            titles: [decodeHTMLEntity($('.entry-title').text())],
            image: image,
            status,
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
        // let html = Buffer.from(createByteArray(response.rawData)).toString()
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".chapter-list .row").toArray().reverse()) {
            var y = $('span:first-child', obj).text();
            var chapNum = i;
            i++;
            if (y.includes('chap') || y.includes('Chap') || y.includes('Chương')) {
                chapNum = parseFloat(y.includes('chap') ? y.split('chap')[1].split(' ')[1] : (y.includes('Chap') ? y.split('Chap')[1].split(' ')[1] : y.split('Chương')[1].split(' ')[1]));
            }
            var time = $('span:last-child', obj).text().trim().split('-');
            chapters.push(createChapter(<Chapter>{
                id: $('span:first-child > a', obj).attr('href'),
                chapNum: isNaN(chapNum) ? i : chapNum,
                name: '',
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(time[1] + '/' + time[0] + '/' + time[2])
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
        let arrayImages = response.data.match(/var content=(.*);/)?.[1];
        let x = arrayImages?.replace(',]', ']');
        let listImages = JSON.parse(x ?? "");
        const pages: string[] = [];

        for (let i in listImages) {
            pages.push(`https://1.truyentranhmanga.com/images/${mangaId.split('/')[3]}/${chapterId.split('/')[3]}/${i}.${listImages[i].includes('webp') ? 'webp' : 'jpg'}`);
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
        let highlight: HomeSection = createHomeSection({
            id: 'highlight',
            title: "TRUYỆN NỔI BẬT",
            view_more: false,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "HOT",
            view_more: true,
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "MỚI CẬP NHẬT",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "MỚI ĐĂNG",
            view_more: true,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "TOP VIEW",
            view_more: true,
        });
        let full: HomeSection = createHomeSection({
            id: 'full',
            title: "HOÀN THÀNH",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(featured);
        sectionCallback(highlight);
        sectionCallback(newUpdated);
        sectionCallback(newAdded);
        sectionCallback(hot);
        sectionCallback(view);
        sectionCallback(full);
        ///Get the section data
        //featured
        let request = createRequestObject({
            url: 'https://truyendep.net/',
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        for (let manga of $('.top_thang li').toArray()) {
            const title = $('a', manga).last().text().trim();
            const id = $('a', manga).first().attr('href') ?? title;
            const image = $('a:first-child img', manga).attr('src').split('-');
            const ext = image.splice(-1)[0].split('.')[1];
            // const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            // if (!id || !subtitle) continue;
            featuredItems.push(createMangaTile({
                id: id,
                image: image.join('-') + '.' + ext,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                // subtitleText: createIconText({
                //     text: sub,
                // }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //highlight
        request = createRequestObject({
            url: 'https://truyendep.net',
            method: "GET",
        });
        let highlightItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.popular-manga li').toArray()) {
            const title = $('a', manga).first().attr('title');
            const id = $('a', manga).first().attr('href') ?? title;
            const image = $('a:first-child img', manga).attr('src').replace('-61x61', '');
            const sub = $('i', manga).text().split(":")[1].trim();
            // if (!id || !subtitle) continue;
            highlightItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        highlight.items = highlightItems;
        sectionCallback(highlight);

        //New Updates
        request = createRequestObject({
            url: 'https://truyendep.net/moi-cap-nhat/',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('a', manga).first().attr('title');
            const id = $('a', manga).first().attr('href') ?? title;
            const image = $('.update_image img', manga).attr('src').replace('-61x61', '');
            const sub = 'Chap' + $('a:nth-of-type(1)', manga).text().trim().split('chap')[1];
            // if (!id || !subtitle) continue;
            newUpdatedItems.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({
                    text: decodeHTMLEntity(title),
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
            url: 'https://truyendep.net/moi-dang/',
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('h3.nowrap a', manga).attr('title');
            const id = $('h3.nowrap a', manga).attr('href') ?? title;
            const image = $('a img', manga).attr('src').split('-');
            const ext = image.splice(-1)[0].split('.')[1];
            const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            // if (!id || !subtitle) continue;
            newAddItems.push(createMangaTile({
                id: id,
                image: image.join('-') + '.' + ext,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        newAdded.items = newAddItems;
        sectionCallback(newAdded);

        // Hot
        request = createRequestObject({
            url: 'https://truyendep.net/hot/',
            method: "GET",
        });
        let popular: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('h3.nowrap a', manga).attr('title');
            const id = $('h3.nowrap a', manga).attr('href') ?? title;
            const image = $('a img', manga).attr('src').split('-');
            const ext = image.splice(-1)[0].split('.')[1];
            const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            // if (!id || !title) continue;
            popular.push(createMangaTile(<MangaTile>{
                id: id,
                image: image.join('-') + '.' + ext,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }));
        }
        hot.items = popular;
        sectionCallback(hot);

        // view
        request = createRequestObject({
            url: 'https://truyendep.net/top-view/',
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('h3.nowrap a', manga).attr('title');
            const id = $('h3.nowrap a', manga).attr('href') ?? title;
            const image = $('a img', manga).attr('src').split('-');
            const ext = image.splice(-1)[0].split('.')[1];
            const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            // if (!id || !title) continue;
            viewItems.push(createMangaTile(<MangaTile>{
                id: id,
                image: image.join('-') + '.' + ext,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }));
        }
        view.items = viewItems;
        sectionCallback(view);

        // full
        request = createRequestObject({
            url: 'https://truyendep.net/full/',
            method: "GET",
        });
        let fullItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (let manga of $('.wrap_update .update_item').toArray()) {
            const title = $('h3.nowrap a', manga).attr('title');
            const id = $('h3.nowrap a', manga).attr('href') ?? title;
            const image = $('a img', manga).attr('src').split('-');
            const ext = image.splice(-1)[0].split('.')[1];
            const sub = 'Chap' + $('a', manga).last().text().trim().split('chap')[1];
            // if (!id || !title) continue;
            fullItems.push(createMangaTile(<MangaTile>{
                id: id,
                image: image.join('-') + '.' + ext,
                title: createIconText({
                    text: decodeHTMLEntity(title),
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }));
        }
        full.items = fullItems;
        sectionCallback(full);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://truyendep.net/moi-cap-nhat/page/${page}/`;
                select = 1;
                break;
            case "new_added":
                url = `https://truyendep.net/moi-dang/page/${page}`;
                select = 2;
                break;
            case "hot":
                url = `https://truyendep.net/hot/page/${page}`;
                select = 2;
                break;
            case "view":
                url = `https://truyendep.net/top-view/page/${page}`;
                select = 2;
                break;
            case "full":
                url = `https://truyendep.net/full/page/${page}`;
                select = 2;
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

        const manga = parseViewMore($, select);
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
            url: query.title ? (`https://truyendep.net/wp-content/themes/manga/list-manga-front.js?nocache=1634580614`)
                : (tags[0].includes('tieudiem') ? DOMAIN : `${tags[0]}/page/${page}/`),
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let tiles: any = [];
        if (query.title) {
            var json = JSON.parse(data.data).filter(function (el: any) {
                return (el.label.toLowerCase() + "::" + ChangeToSlug(el.label)).includes(query.title?.toLowerCase() ?? "")
            });
            for (let manga of json) {
                const title = manga.label;
                const id = manga.link;
                const image = manga.img.split('-');
                const ext = image?.splice(-1)[0].split('.')[1];
                tiles.push(createMangaTile(<MangaTile>{
                    id: id,
                    image: image?.join('-') + '.' + ext,
                    title: createIconText({
                        text: decodeHTMLEntity(title),
                    })
                }));
            }
            metadata = undefined;
        } else {
            let $ = this.cheerio.load(data.data);
            if (tags[0].includes('tieudiem')) {
                for (let manga of $('.feature_topxem a').toArray()) {
                    const title = $('img', manga).attr('title') ?? "";
                    const id = $(manga).attr('href') ?? title;
                    const image = $('img', manga).attr('src')?.split('-');
                    const ext = image?.splice(-1)[0].split('.')[1];
                    tiles.push(createMangaTile(<MangaTile>{
                        id: id,
                        image: image?.join('-') + '.' + ext,
                        title: createIconText({
                            text: decodeHTMLEntity(title),
                        })
                    }));
                }
                let request2 = createRequestObject({
                    url: "https://truyendep.net/wp-content/themes/manga/focus.html?nocache=1634673567",
                    method: "GET",
                });
                let data2 = await this.requestManager.schedule(request2, 1);
                let $2 = this.cheerio.load(data2.data);
                for (let manga of $2('.wrap-focus a').toArray()) {
                    const title = $('img', manga).attr('title') ?? "";
                    const id = $(manga).attr('href') ?? title;
                    const image = $('img', manga).attr('src')?.split('-');
                    const ext = image?.splice(-1)[0].split('.')[1];
                    tiles.push(createMangaTile(<MangaTile>{
                        id: id,
                        image: image?.join('-') + '.' + ext,
                        title: createIconText({
                            text: decodeHTMLEntity(title),
                        })
                    }));
                }
                metadata = undefined;
            } else {
                tiles = parseSearch($);
                metadata = !isLastPage($) ? { page: page + 1 } : undefined;
            }
        }

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
        const arrayTags: Tag[] = [{
            label: 'Tiêu điểm',
            id: 'tieudiem'
        }];
        const collectedIds: string[] = [];
        //the loai
        for (const tag of $('.theloai a').toArray()) {
            arrayTags.push({ id: $(tag).attr('href'), label: $(tag).text().trim() });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }

    globalRequestHeaders(): RequestHeaders { //cái này chỉ fix load ảnh thôi, ko load đc hết thì đéo phải do cái này
        return {
            referer: DOMAIN
        }
    }
}