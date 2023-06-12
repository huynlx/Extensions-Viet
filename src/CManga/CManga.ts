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
    Response,
    Request,
    MangaTile,
    Tag,
    LanguageCode
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, decodeHTMLEntity, decrypt_data, titleCase, change_alias } from "./CMangaParser"

export const DOMAIN = 'https://cmangaaf.com/'
const method = 'GET'

export const CMangaInfo: SourceInfo = {
    version: '2.1.1',
    name: 'CManga',
    icon: 'icon.png',
    author: 'Huynhzip3',
    authorWebsite: 'https://github.com/huynh12345678',
    description: 'Extension that pulls manga from CManga',
    websiteBaseURL: `${DOMAIN}`,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class CManga extends Source {
    getMangaShareUrl(mangaId: string): string { return DOMAIN + mangaId.split("::")[0] };
    requestManager = createRequestManager({
        requestsPerSecond: 2,
        requestTimeout: 15000,
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
        const request = createRequestObject({
            url: DOMAIN + mangaId.split("::")[0],
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const book_id = $.html().match(/book_id.+"(.+)"/)[1];
        // const request2 = createRequestObject({
        //     url:  DOMAIN +"api/book_detail?opt1=" + book_id,
        //     method: "GET",
        // });
        // const data2 = await this.requestManager.schedule(request2, 1);
        // var json = JSON.parse(decrypt_data(JSON.parse(data2.data)))[0];
        // let tags: Tag[] = [];
        let status = $(".status").first().text().indexOf("Đang") != -1 ? 1 : 0;
        let desc = $("#book_detail").first().text() === '' ? $("#book_more").first().text() : $("#book_detail").first().text();
        // for (const t of json.tags.split(",")) {
        //     if (t === '') continue;
        //     const genre = t;
        //     const id = genre;
        //     tags.push(createTag({ label: titleCase(genre), id }));
        // }
        const image = $(".book_avatar img").first().attr("src");
        const creator = $(".profile a").text() || 'Unknown';

        return createManga({
            id: mangaId + "::" + book_id,
            author: creator,
            artist: creator,
            desc: decodeHTMLEntity(desc),
            titles: [titleCase($("h1").text())],
            image: DOMAIN + image,
            status,
            hentai: false,
            // tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request2 = createRequestObject({
            url: `${DOMAIN}api/book_chapter?opt1=` + mangaId.split("::")[2],
            method: "GET",
        });
        const data2 = await this.requestManager.schedule(request2, 1);
        var json = JSON.parse(decrypt_data(JSON.parse(data2.data)));
        const chapters: Chapter[] = [];
        for (const obj of json) {
            const time = obj.last_update.split(' ');
            const d = time[0].split('-');
            const t = time[1].split(':');
            const d2 = d[1] + '/' + d[2] + '/' + d[0];
            const t2 = t[0] + ":" + t[1];
            chapters.push(createChapter(<Chapter>{
                id: DOMAIN + mangaId.split("::")[1] + '/' + change_alias(obj.chapter_name) + '/' + obj.id_chapter,
                chapNum: parseFloat(obj.chapter_num),
                name: titleCase(obj.chapter_name) === ('Chapter ' + obj.chapter_num) ? '' : titleCase(obj.chapter_name),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(d2 + " " + t2)
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const url = `${DOMAIN}${chapterId}`;
        const chapID = url.split('/').pop();
        const request = createRequestObject({
            url: `${DOMAIN}api/chapter_content?opt1=` + chapID,
            method
        });
        const data = await this.requestManager.schedule(request, 1);
        var chapter_content = JSON.parse(JSON.parse(decrypt_data(JSON.parse(data.data)))[0].content);
        var pages = [];
        for (const img of chapter_content) {
            // pages.push(img);
            pages.push(img.replace('.net', '.com').replace('?v=1&', '?v=9999&')); //1,01,11,21,31,41,...
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
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Truyện mới cập nhật",
            view_more: true,
        });
        let newAdded: HomeSection = createHomeSection({
            id: 'new_added',
            title: "VIP Truyện Siêu Hay",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(newAdded);

        ///Get the section data
        //New Updates
        let request = createRequestObject({
            url: `${DOMAIN}api/list_item`,
            method: "GET",
            param: '?page=1&limit=20&sort=new&type=all&tag=&child=off&status=all&num_chapter=0'
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let json = JSON.parse(decrypt_data(JSON.parse(data.data)));
        for (var i of Object.keys(json)) {
            var item = json[i];
            if (!item.name) continue;
            newUpdatedItems.push(createMangaTile({
                id: item.url + '-' + item.id_book + "::" + item.url,
                image: DOMAIN + 'assets/tmp/book/avatar/' + item.avatar + '.jpg',
                title: createIconText({
                    text: titleCase(item.name),
                }),
                subtitleText: createIconText({
                    text: 'Chap ' + item.last_chapter,
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //New Added
        request = createRequestObject({
            url: DOMAIN + "api/list_item",
            param: "?page=1&limit=20&sort=new&type=all&tag=Truy%E1%BB%87n%20si%C3%AAu%20hay&child=off&status=all&num_chapter=0",
            method: "GET",
        });
        let newAddItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        json = JSON.parse(decrypt_data(JSON.parse(data.data)));
        console.log(json);

        for (var i of Object.keys(json)) {
            var item = json[i];
            if (!item.name) continue;
            newAddItems.push(createMangaTile({
                id: item.url + '-' + item.id_book + "::" + item.url,
                image: DOMAIN + 'assets/tmp/book/avatar/' + item.avatar + '.jpg',
                title: createIconText({
                    text: titleCase(item.name),
                }),
                subtitleText: createIconText({
                    text: 'Chap ' + item.last_chapter,
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
        let method = "GET";
        switch (homepageSectionId) {
            case "new_updated":
                url = DOMAIN + "api/list_item";
                param = `?page=${page}&limit=40&sort=new&type=all&tag=&child=off&status=all&num_chapter=0`;
                break;
            case "new_added":
                url = DOMAIN + "api/list_item";
                param = `?page=${page}&limit=40&sort=new&type=all&tag=Truy%E1%BB%87n%20si%C3%AAu%20hay&child=off&status=all&num_chapter=0`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method,
            param
        });
        let data = await this.requestManager.schedule(request, 1);
        var json = JSON.parse(decrypt_data(JSON.parse(data.data))); // object not array
        const manga = parseViewMore(json);
        var allPage = (json['total'] / 40);
        metadata = (page < allPage) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const search = {
            status: "all",
            num_chapter: "0",
            sort: "new",
            tag: "",
            top: ""
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'sort':
                    search.sort = (value.split(".")[1]);
                    break
                case 'status':
                    search.status = (value.split(".")[1]);
                    break
                case 'num':
                    search.num_chapter = (value.split(".")[1]);
                    break
                case 'tag':
                    search.tag = (value.split(".")[1]);
                    break
                case 'top':
                    search.top = (value.split(".")[1]);
                    break
            }
        })
        const request = createRequestObject({
            url: query.title ? encodeURI(DOMAIN + 'api/search?opt1=' + (query.title))
                : (search.top !== '' ? DOMAIN + "api/top?data=book_top" : encodeURI(DOMAIN + `api/list_item?page=${page}&limit=40&sort=${search.sort}&type=all&tag=${search.tag}&child=off&status=${search.status}&num_chapter=${search.num_chapter}`)),
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        var json = (query.title || search.top !== "") ? JSON.parse(data.data) : JSON.parse(decrypt_data(JSON.parse(data.data))); // object not array
        const tiles = parseSearch(json, search);
        var allPage = (json['total'] / 40);
        metadata = (page < allPage) ? { page: page + 1 } : undefined;
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
        const arrayTags2: Tag[] = [
            {
                label: 'Ngày đăng',
                id: 'sort.new'
            },
            {
                label: 'Lượt xem',
                id: 'sort.view'
            },
            {
                label: 'Lượt theo dõi',
                id: 'sort.follow'
            }
        ];
        const arrayTags3: Tag[] = [
            {
                label: 'Tất cả',
                id: 'status.all'
            },
            {
                label: 'Hoàn thành',
                id: 'status.completed'
            }
        ];
        const arrayTags4: Tag[] = [
            {
                label: '>= 100',
                id: 'num.100'
            },
            {
                label: '>= 200',
                id: 'num.200'
            },
            {
                label: '>= 300',
                id: 'num.300'
            },
            {
                label: '>= 400',
                id: 'num.400'
            },
            {
                label: '>= 500',
                id: 'num.500'
            }
        ];

        const arrayTags5: Tag[] = [
            {
                label: 'Top Ngày',
                id: 'top.day'
            },
            {
                label: 'Top Tuần',
                id: 'top.week'
            },
            {
                label: 'Top Tổng',
                id: 'top.month'
            }
        ]

        //the loai
        for (const tag of $('.book_tags_content a').toArray()) {
            const label = $(tag).text().trim();
            const id = 'tag.' + label;
            arrayTags.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '4', label: 'Rank', tags: arrayTags5.map(x => createTag(x)) }),
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Sắp xếp theo', tags: arrayTags2.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình trạng', tags: arrayTags3.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Num chapter', tags: arrayTags4.map(x => createTag(x)) })
        ]
        return tagSections;
    }
}
