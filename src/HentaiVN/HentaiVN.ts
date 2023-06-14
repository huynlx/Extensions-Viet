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
    Request,
    Response,
    HomeSectionType
} from "paperback-extensions-common";

import {
    parseRandomSections,
    parseSearch,
    isLastPage,
    parseChapterDetails,
    parseChapters,
    parseFullSections,
    parseHomeSections,
    parseMangaDetails,
    parseViewMore,
    parseAddedSections,
    parsePopularSections
} from "./HentaiVNParser";

import tags from './tags.json';

const DOMAIN = `https://hentaivn.site/`;
const method = 'GET';

export const HentaiVNInfo: SourceInfo = {
    version: '2.8.1',
    name: 'HentaiVN',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from HentaiVN',
    websiteBaseURL: '',
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
};

export class HentaiVN extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}${mangaId}`; };
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
                };

                return request;
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response;
            }
        }
    });
    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${DOMAIN}`,
            method,
            param: mangaId.split("::")[0],
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        return parseMangaDetails($, mangaId);
    }

    async getChapters(mangaId: string): Promise<Chapter[]> { // mangaId.split("::")[0] => 29680-doc-truyen-caffenny-hobaku.html
        const idchapshow = mangaId.split("::")[0].split('-doc-truyen-')[0];
        const idlinkanime = mangaId.split("::")[0].split('-doc-truyen-')[1];
        const request = createRequestObject({
            url: `${DOMAIN}`, //https://hentaivn.site/list-showchapter.php?idchapshow=12378&idlinkanime=ban-cung-phong-bat-dac-di
            method,
            param: `list-showchapter.php?idchapshow=${idchapshow}&idlinkanime=${idlinkanime}`,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        return parseChapters($, mangaId);
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}`,
            method,
            param: chapterId,
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        return parseChapterDetails($, mangaId, chapterId);
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const section0 = createHomeSection({ id: 'featured', title: 'Tiêu điểm', type: HomeSectionType.featured });
        const section5 = createHomeSection({ id: 'random', title: 'Truyện ngẫu nhiên', view_more: false });
        const section1 = createHomeSection({ id: 'recently-updated', title: 'Mới cập nhật', view_more: true });
        const section2 = createHomeSection({ id: 'popular', title: 'Tiêu điểm', view_more: true });
        const section3 = createHomeSection({ id: 'recently_added', title: 'Truyện mới đăng', view_more: true });
        const section4 = createHomeSection({ id: 'full', title: 'Truyện đã hoàn thành', view_more: true });
        const sections = [section0, section5, section1, section3, section4];

        let request = createRequestObject({
            url: `${DOMAIN}`,
            method,
        });

        let justUpdated = createRequestObject({
            url: `${DOMAIN}list-moicapnhat-doc.php`,
            method,
        });

        let response = await this.requestManager.schedule(request, 1);
        let response2 = await this.requestManager.schedule(justUpdated, 1);
        let $ = this.cheerio.load(response.data);
        let $2 = this.cheerio.load(response2.data);
        parseHomeSections($, $2, sections, sectionCallback);

        //random
        request = createRequestObject({
            url: DOMAIN + 'list-random.php',
            method: 'GET'
        });
        response = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(response.data);
        parseRandomSections($, sections, sectionCallback);

        //added
        request = createRequestObject({
            url: `${DOMAIN}danh-sach.html`,
            method,
        });
        response = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(response.data);
        parseAddedSections($, sections, sectionCallback);

        /*   //popular
          request = createRequestObject({
              url: `${DOMAIN}tieu-diem.html`,
              method
          });
          response = await this.requestManager.schedule(request, 1);
          $ = this.cheerio.load(response.data);
          parsePopularSections($, sections, sectionCallback); */

        //full
        request = createRequestObject({
            url: `${DOMAIN}da-hoan-thanh.html`,
            method,
        });
        response = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(response.data);
        parseFullSections($, sections, sectionCallback);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let select = 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "recently-updated":
                url = `${DOMAIN}`;
                param = `?page=${page}`;
                select = 1;
                break;
            case "recently_added":
                url = `${DOMAIN}danh-sach.html`;
                param = `?page=${page}`;
                select = 2;
                break;
            case "popular":
                url = `${DOMAIN}tieu-diem.html`;
                param = `?page=${page}`;
                select = 3;
                break;
            case "full":
                url = `${DOMAIN}da-hoan-thanh.html`;
                param = `?page=${page}`;
                select = 3;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }));
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
        let page: number = metadata?.page ?? 1;
        const tag = query.includedTags?.map(tag => tag.id) ?? [];
        var url = '';
        if (query.title) {
            url = `${DOMAIN}tim-kiem-truyen.html?key=${encodeURI(query.title)}`; //encodeURI để search được chữ có dấu
        } else {
            if (tag[0].includes('https')) {
                url = tag[0].split('?')[0];
            } else {
                url = `${DOMAIN}${tag[0]}?`;
            }
        }

        var request = createRequestObject({ //temp
            url,
            method
        });

        if (query.title) {
            request = createRequestObject({
                url,
                method,
                param: `&page=${page}`
            });
        } else {
            if (tag[0].includes('https')) {
                request = createRequestObject({
                    url,
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        'idviewtop': tag[0].split('?')[1]
                    }
                });
            } else {
                request = createRequestObject({
                    url,
                    method,
                    param: `&page=${page}`
                });
            }
        }

        var manga = [];
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        if (query.title) {
            manga = parseSearch($);
        } else {
            if (tag[0].includes('https')) {
                for (let obj of $('li').toArray()) {
                    const id = $('.view-top-1 > a', obj).attr('href')?.split('/').pop() ?? "";
                    const title = $('.view-top-1 > a', obj).text();
                    const subtitle = $(".view-top-2", obj).text().trim();
                    let request2 = createRequestObject({ //có thể lỗi ở đoạn lấy image này (đm cái top ngày => lúc nào rảnh thì fix sau)
                        url: DOMAIN + id,
                        method,
                    });
                    let response = await this.requestManager.schedule(request2, 1);
                    let $2 = this.cheerio.load(response.data);
                    let image = $2('.page-ava > img').attr('src');
                    manga.push(createMangaTile({
                        id: encodeURIComponent(id) + "::" + image,
                        image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
                        title: createIconText({ text: title }),
                        subtitleText: createIconText({ text: subtitle }),
                    }));
                }
            } else {
                manga = parseSearch($);
            }
        }

        if (query.title) {
            metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        } else {
            if (tag[0].includes('https')) {
                metadata = undefined;
            } else {
                metadata = !isLastPage($) ? { page: page + 1 } : undefined;
            }
        }

        return createPagedResults({
            results: manga,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const topView = [
            {
                label: 'Top View Ngày',
                id: DOMAIN + 'list-top.php?1'
            },
            {
                label: 'Top View Tuần',
                id: DOMAIN + 'list-top.php?2'
            },
            {
                label: 'Top View Tháng',
                id: DOMAIN + 'list-top.php?3'
            },
            {
                label: 'Top View All',
                id: DOMAIN + 'list-top.php?4'
            }
        ];
        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Bảng Xếp Hạng', tags: topView.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) })
        ];
        return tagSections;
    }
}
