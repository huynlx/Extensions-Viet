import {
  Chapter,
  ChapterDetails,
  HomeSection,
  Manga,
  PagedResults,
  Response,
  Request,
  SearchRequest,
  Source,
  SourceInfo,
  TagType,
  TagSection,
  HomeSectionType,
  ContentRating,
  MangaUpdates,
} from "paperback-extensions-common";
import { Parser } from "./NetTruyenParser";

const DOMAIN = "https://nettruyenar.com/";

export const isLastPage = ($: CheerioStatic): boolean => {
  const current = $("ul.pagination > li.active > span.page-link").text();
  let total = $("ul.pagination > li:nth-last-child(2) > a.page-link").text();

  if (current) {
    total = total ?? "";
    return +total === +current; //+ => convert value to number
  }
  return true;
};

export const NetTruyenInfo: SourceInfo = {
  version: "3.1.0",
  name: "NetTruyen",
  icon: "icon.png",
  author: "Huynhzip3",
  authorWebsite: "https://github.com/huynh12345678",
  description: "Extension that pulls manga from NetTruyen.",
  websiteBaseURL: DOMAIN,
  contentRating: ContentRating.MATURE,
  sourceTags: [
    {
      text: "Recommended",
      type: TagType.BLUE,
    },
    {
      text: "Notifications",
      type: TagType.GREEN,
    },
  ],
};

export class NetTruyen extends Source {
  parser = new Parser();
  getMangaShareUrl(mangaId: string): string {
    return `${DOMAIN}truyen-tranh/${mangaId}`;
  }
  requestManager = createRequestManager({
    requestsPerSecond: 5,
    requestTimeout: 20000,
    interceptor: {
      interceptRequest: async (request: Request): Promise<Request> => {
        request.headers = {
          ...(request.headers ?? {}),
          ...{
            referer: DOMAIN,
          },
        };

        return request;
      },

      interceptResponse: async (response: Response): Promise<Response> => {
        return response;
      },
    },
  });

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const url = `${DOMAIN}truyen-tranh/${mangaId}`;
    const request = createRequestObject({
      url: url,
      method: "GET",
    });
    const data = await this.requestManager.schedule(request, 1);
    let $ = this.cheerio.load(data.data);
    return this.parser.parseMangaDetails($, mangaId);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const url = `${DOMAIN}`;

    // Tách chuỗi mangaId thành slug và comicId (ví dụ: "bach-luyen-thanh-than-1099")
    const lastHyphenIndex = mangaId.lastIndexOf("-");
    const slug = mangaId.substring(0, lastHyphenIndex);
    const comicId = mangaId.substring(lastHyphenIndex + 1);

    const request = createRequestObject({
      url: `${url}/Comic/Services/ComicService.asmx/ChapterList?slug=${slug}&comicId=${comicId}`,
      method: "GET",
      headers: {
        accept: "*/*",
        "accept-language": "vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7",
        "x-requested-with": "XMLHttpRequest",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
    });

    const data = await this.requestManager.schedule(request, 1);
    const json = JSON.parse(data.data);

    const chapterList: any[] = json?.data ?? [];
    const chapters = this.parser.parseChapterList(chapterList, mangaId);

    return chapters;
  }

  async getChapterDetails(
    mangaId: string,
    chapterId: string,
  ): Promise<ChapterDetails> {
    // Tách chuỗi mangaId thành slug và comicId (ví dụ: "bach-luyen-thanh-than-1099")
    const lastHyphenIndex = mangaId.lastIndexOf("-");
    const slug = mangaId.substring(0, lastHyphenIndex);
    const comicId = mangaId.substring(lastHyphenIndex + 1);

    const request = createRequestObject({
      url: `${DOMAIN}truyen-tranh/${slug}/${chapterId}`,
      method: "GET",
    });
    const data = await this.requestManager.schedule(request, 1);
    let $ = this.cheerio.load(data.data);
    const pages = this.parser.parseChapterDetails($);
    return createChapterDetails({
      pages: pages,
      longStrip: false,
      id: chapterId,
      mangaId: mangaId,
    });
  }

  async getSearchResults(
    query: SearchRequest,

    metadata: any,
  ): Promise<PagedResults> {
    let page = metadata?.page ?? 1;

    const tags = query.includedTags?.map((tag) => tag.id) ?? [];

    const genres: string[] = [];

    tags.forEach((value) => {
      if (value.indexOf(".") === -1) {
        genres.push(value);
      }
    });

    const url = `${DOMAIN}`;

    const genrePath = genres.length === 1 ? `${genres[0]}` : "";

    const request = createRequestObject({
      url:
        genres.length === 1 && !query.title
          ? `${url}${genrePath}`
          : `${url}tim-truyen`,

      method: "GET",

      param: !query.title
        ? encodeURI(`?page=${page}`)
        : encodeURI(`?keyword=${query.title ?? ""}&page=${page}`),
    });

    const data = await this.requestManager.schedule(request, 1);

    let $ = this.cheerio.load(data.data);

    const tiles = this.parser.parseSearchResults($);

    metadata = !isLastPage($) ? { page: page + 1 } : undefined;

    return createPagedResults({
      results: tiles,

      metadata,
    });
  }

  async getHomePageSections(
    sectionCallback: (section: HomeSection) => void,
  ): Promise<void> {
    let featured: HomeSection = createHomeSection({
      id: "featured",
      title: "Truyện Đề Cử",
      type: HomeSectionType.featured,
    });
    let newUpdated: HomeSection = createHomeSection({
      id: "new_updated",
      title: "Truyện Mới Cập Nhật",
      view_more: true,
    });
    let viewest: HomeSection = createHomeSection({
      id: "viewest",
      title: "Truyện Xem Nhiều Nhất",
      view_more: true,
    });
    let hot: HomeSection = createHomeSection({
      id: "hot",
      title: "Truyện Hot Nhất",
      view_more: true,
    });

    let newAdded: HomeSection = createHomeSection({
      id: "new_added",
      title: "Truyện Mới Thêm Gần Đây",
      view_more: true,
    });
    let full: HomeSection = createHomeSection({
      id: "full",
      title: "Truyện Đã Hoàn Thành",
      view_more: true,
    });

    //Load empty sections
    sectionCallback(featured);
    sectionCallback(newUpdated);
    sectionCallback(viewest);
    sectionCallback(hot);
    sectionCallback(newAdded);
    sectionCallback(full);

    ///Get the section data
    //Featured
    let url = `${DOMAIN}`;
    let request = createRequestObject({
      url: url,
      method: "GET",
    });
    let data = await this.requestManager.schedule(request, 1);
    let $ = this.cheerio.load(data.data);

    featured.items = this.parser.parseFeaturedSection($);
    sectionCallback(featured);

    //New Updates
    url = `${DOMAIN}`;
    request = createRequestObject({
      url: url,
      method: "GET",
    });
    data = await this.requestManager.schedule(request, 1);
    $ = this.cheerio.load(data.data);

    newUpdated.items = this.parser.parseNewUpdatedSection($);
    sectionCallback(newUpdated);

    //View
    url = `${DOMAIN}tim-truyen?status=-1&sort=10`;
    request = createRequestObject({
      url: url,
      method: "GET",
    });
    data = await this.requestManager.schedule(request, 1);
    $ = this.cheerio.load(data.data);

    viewest.items = this.parser.parsePopularSection($);
    sectionCallback(viewest);

    //Hot
    url = `${DOMAIN}truyen-tranh-hot`;
    request = createRequestObject({
      url: url,
      method: "GET",
    });
    data = await this.requestManager.schedule(request, 1);
    $ = this.cheerio.load(data.data);

    hot.items = this.parser.parseHotSection($);
    sectionCallback(hot);

    //New added
    url = `${DOMAIN}tim-truyen?status=-1&sort=15`;
    request = createRequestObject({
      url: url,
      method: "GET",
    });
    data = await this.requestManager.schedule(request, 1);
    $ = this.cheerio.load(data.data);

    newAdded.items = this.parser.parseNewAddedSection($);
    sectionCallback(newAdded);

    //Full
    url = `${DOMAIN}tim-truyen?status=2&sort=30`;
    request = createRequestObject({
      url: url,
      method: "GET",
    });
    data = await this.requestManager.schedule(request, 1);
    $ = this.cheerio.load(data.data);

    full.items = this.parser.parseFullSection($);
    sectionCallback(full);
  }

  async getViewMoreItems(
    homepageSectionId: string,
    metadata: any,
  ): Promise<PagedResults> {
    let page: number = metadata?.page ?? 1;
    let param = "";
    let url = "";
    switch (homepageSectionId) {
      case "viewest":
        param = `?status=-1&sort=10&page=${page}`;
        url = `${DOMAIN}tim-truyen`;
        break;
      case "hot":
        param = `?page=${page}`;
        url = `${DOMAIN}truyen-tranh-hot`;
        break;
      case "new_updated":
        param = `?page=${page}`;
        url = DOMAIN;
        break;
      case "new_added":
        param = `?status=-1&sort=15&page=${page}`;
        url = `${DOMAIN}tim-truyen`;
        break;
      case "full":
        param = `?status=2&sort=30&page=${page}`;
        url = `${DOMAIN}tim-truyen`;
        break;
      default:
        throw new Error(
          "Requested to getViewMoreItems for a section ID which doesn't exist",
        );
    }

    const request = createRequestObject({
      url,
      method: "GET",
      param,
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);

    const manga = this.parser.parseViewMoreItems($);
    const isLastPage = this.parser.parseIsLastPage($);
    metadata = isLastPage ? undefined : { page: page + 1 };

    return createPagedResults({
      results: manga,
      metadata,
    });
  }

  async getSearchTags(): Promise<TagSection[]> {
    const url = `${DOMAIN}tim-truyen`;
    const request = createRequestObject({
      url: url,
      method: "GET",
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    return this.parser.parseTags($);
  }

  override async filterUpdatedManga(
    mangaUpdatesFoundCallback: (updates: MangaUpdates) => void,
    time: Date,
    ids: string[],
  ): Promise<void> {
    const updateManga: any = [];
    const pages = 10;
    for (let i = 1; i < pages + 1; i++) {
      const request = createRequestObject({
        url: DOMAIN + "?page=" + i,
        method: "GET",
      });
      const response = await this.requestManager.schedule(request, 1);
      const $ = this.cheerio.load(response.data);
      // let x = $('time.small').text().trim();
      // let y = x.split("lúc:")[1].replace(']', '').trim().split(' ');
      // let z = y[1].split('/');
      // const timeUpdate = new Date(z[1] + '/' + z[0] + '/' + z[2] + ' ' + y[0]);
      // updateManga.push({
      //     id: item,
      //     time: timeUpdate
      // })
      for (let manga of $("div.item", "div.row").toArray()) {
        const id = $("figure.clearfix > div.image > a", manga)
          .attr("href")
          ?.split("/")
          .pop();
        const time = $(
          "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > i",
          manga,
        )
          .last()
          .text()
          .trim();
        updateManga.push({
          id: id,
          time: time,
        });
      }
    }

    const returnObject = this.parser.parseUpdatedManga(updateManga, time, ids);
    mangaUpdatesFoundCallback(createMangaUpdates(returnObject));
  }
}
